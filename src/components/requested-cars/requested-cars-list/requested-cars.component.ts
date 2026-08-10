import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import {
  DxDataGridModule,
  DxDataGridComponent,
} from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { RequestedCarService } from '../../../services/requested-car.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { RequestedCarAiPanelComponent } from '../requested-car-ai-panel/requested-car-ai-panel.component';
import { RequestedCar } from '../../../models/requested-car.model';
import { getStatusClass, getPriorityClass, getReservationStatusClass } from '../requested-car-status.util';

@Component({
  selector: 'app-requested-cars',
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
    MatInputModule,
    DxDataGridModule,
    TranslateModule,
  ],
  templateUrl: './requested-cars.component.html',
  styleUrl: './requested-cars.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarsComponent {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private requestedCarService = inject(RequestedCarService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  statusFilter = signal<string>('');
  priorityFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  loading = signal(false);
  lastLoadedRows = signal<RequestedCar[]>([]);

  readonly gridStateKey = 'requestedCarsGridState';

  statusOptions = ['New', 'Contacted', 'Sourced', 'Closed'];
  priorityOptions = ['Low', 'Medium', 'High', 'Urgent'];

  dataSource = new CustomStore<RequestedCar>({
    key: 'id',
    load: async (loadOptions) => {
      this.loading.set(true);
      const options: Record<string, unknown> = { ...loadOptions };

      const filters: unknown[] = [];
      if (this.statusFilter()) filters.push(['status', '=', this.statusFilter()]);
      if (this.priorityFilter()) filters.push(['priority', '=', this.priorityFilter()]);
      if (filters.length > 0) {
        const existing = options['filter'];
        options['filter'] = existing ? [existing, ...filters.flatMap(f => ['and', f])] : (filters.length === 1 ? filters[0] : filters);
      }

      try {
        const result = await firstValueFrom(this.requestedCarService.loadDataGrid(options));
        this.loading.set(false);
        this.lastLoadedRows.set(result?.data ?? []);
        return {
          data: result?.data ?? [],
          totalCount: result?.totalCount ?? 0,
        };
      } catch (err) {
        this.loading.set(false);
        throw err;
      }
    },
  });

  summary = computed(() => {
    const rows = this.lastLoadedRows();
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      total: rows.length,
      newCount: rows.filter(r => r.status === 'New').length,
      inProgress: rows.filter(r => r.status === 'Contacted' || r.status === 'Sourced').length,
      urgent: rows.filter(r => r.priority === 'Urgent').length,
      expectedThisWeek: rows.filter(r => {
        if (!r.expectedArrival) return false;
        const d = new Date(r.expectedArrival);
        return d >= now && d <= weekFromNow;
      }).length,
    };
  });

  getStatusClass = getStatusClass;
  getPriorityClass = getPriorityClass;
  getReservationStatusClass = getReservationStatusClass;

  newRequest(): void {
    this.router.navigate(['/requested-cars/new']);
  }

  editRequest(id: number): void {
    this.router.navigate(['/requested-cars/edit', id]);
  }

  openDetails(e: { data?: RequestedCar }): void {
    if (e.data) {
      this.editRequest(e.data.id);
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.requestedCarService.delete(id).subscribe(() => {
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
  }

  onStatusFilterChange(): void {
    this.refresh();
  }

  onPriorityFilterChange(): void {
    this.refresh();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.priorityFilter.set('');
    this.grid?.instance?.clearFilter();
    this.refresh();
  }

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('RequestedCars');
        exportDataGrid({
          component: this.grid.instance,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'RequestedCars.xlsx');
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
        doc.save('RequestedCars.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }

  openHistory(id: number): void {
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'RequestedCar', entityId: id },
      width: '600px',
      panelClass: 'responsive-dialog-panel',
    });
  }

  openAiPanel(row: RequestedCar): void {
    this.dialog.open(RequestedCarAiPanelComponent, {
      data: { requestedCar: row },
      width: '600px',
      panelClass: 'responsive-dialog-panel',
    });
  }
}
