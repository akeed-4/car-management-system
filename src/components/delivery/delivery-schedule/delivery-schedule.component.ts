import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import {
  DxDataGridModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DeliveryService } from '../../../services/delivery.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { DeliverySchedule } from '../../../models/delivery.model';
import { getDeliveryStatusClass, isLateDelivery, isTodayDelivery } from '../delivery-status.util';

interface DaySchedule {
  date: Date;
  deliveries: DeliverySchedule[];
}

@Component({
  selector: 'app-delivery-schedule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    HasPermissionDirective,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatMenuModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonToggleModule,
    DxDataGridModule,
    TranslateModule,
  ],
  templateUrl: './delivery-schedule.component.html',
  styleUrl: './delivery-schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryScheduleComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  viewMode = signal<'grid' | 'calendar'>('grid');
  statusFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<DeliverySchedule[]>([]);

  readonly gridStateKey = 'deliveryScheduleGridState';

  statusOptions = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];

  dataSource = new CustomStore<DeliverySchedule>({
    key: 'id',
    load: (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      if (this.statusFilter()) {
        const statusFilterExpr = ['status', '=', this.statusFilter()];
        const existing = options['filter'];
        options['filter'] = existing ? [existing, 'and', statusFilterExpr] : statusFilterExpr;
      }

      return this.deliveryService.loadDataGrid(options).toPromise()
        .then(result => {
          this.lastLoadedRows.set(result?.data ?? []);
          return {
            data: result?.data ?? [],
            totalCount: result?.totalCount ?? 0,
          };
        });
    },
  });

  summary = computed(() => {
    const rows = this.lastLoadedRows();
    return {
      today: rows.filter(r => isTodayDelivery(r)).length,
      late: rows.filter(r => isLateDelivery(r)).length,
      upcoming: rows.filter(r => r.status === 'Scheduled' && !isLateDelivery(r)).length,
      completed: rows.filter(r => r.status === 'Completed').length,
    };
  });

  calendarDays = computed<DaySchedule[]>(() => {
    const days: DaySchedule[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      days.push({ date: day, deliveries: [] });
    }

    for (const delivery of this.lastLoadedRows()) {
      const deliveryDate = new Date(delivery.deliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        days[dayIndex].deliveries.push(delivery);
      }
    }

    days.forEach(day => day.deliveries.sort((a, b) => (a.deliveryTime ?? '').localeCompare(b.deliveryTime ?? '')));
    return days;
  });

  getDeliveryStatusClass = getDeliveryStatusClass;
  isLateDelivery = isLateDelivery;

  ngOnInit(): void {
    this.deliveryService.loadDataGrid({ take: 10000 }).subscribe(result => {
      this.lastLoadedRows.set(result.data);
    });
  }

  newDelivery(): void {
    this.router.navigate(['/deliveries/new']);
  }

  editDelivery(id: number): void {
    this.router.navigate(['/deliveries/edit', id]);
  }

  openDetails(e: { data?: DeliverySchedule }): void {
    if (e.data) {
      this.editDelivery(e.data.id);
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.deliveryService.delete(id).subscribe(() => {
        this.refresh();
      });
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  refresh(): void {
    this.grid?.instance?.refresh();
    this.deliveryService.loadDataGrid({ take: 10000 }).subscribe(result => {
      this.lastLoadedRows.set(result.data);
    });
  }

  onStatusFilterChange(): void {
    this.refresh();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.grid?.instance?.clearFilter();
    this.refresh();
  }

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DeliverySchedule');
        exportDataGrid({
          component: this.grid.instance,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DeliverySchedule.xlsx');
            });
          });
        });
      });
    });
  }

  exportPdf(): void {
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component: this.grid.instance,
      }).then(() => {
        doc.save('DeliverySchedule.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }

  openHistory(id: number): void {
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'DeliverySchedule', entityId: id },
      width: '600px',
    });
  }
}
