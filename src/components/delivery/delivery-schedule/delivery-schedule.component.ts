import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, computed, inject, signal, viewChild, ViewChild } from '@angular/core';
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
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { DeliveryService } from '../../../services/delivery.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { DeliverySchedule } from '../../../models/delivery.model';
import { getDeliveryStatusClass, isLateDelivery, isTodayDelivery } from '../delivery-status.util';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

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
    SharedDataGridComponent,
    TranslateModule,
  ],
  templateUrl: './delivery-schedule.component.html',
  styleUrl: './delivery-schedule.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryScheduleComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private deliveryService = inject(DeliveryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private permissionService = inject(PermissionService);

  viewMode = signal<'grid' | 'calendar'>('grid');
  statusFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<DeliverySchedule[]>([]);

  readonly gridStateKey = 'deliveryScheduleGridState';

  statusOptions = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];

  dataSource = new CustomStore<DeliverySchedule>({
    key: 'id',
    load: async (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      if (this.statusFilter()) {
        const statusFilterExpr = ['status', '=', this.statusFilter()];
        const existing = options['filter'];
        options['filter'] = existing ? [existing, 'and', statusFilterExpr] : statusFilterExpr;
      }

      const result = await firstValueFrom(this.deliveryService.loadDataGrid(options));
      this.lastLoadedRows.set(result?.data ?? []);
      return {
        data: result?.data ?? [],
        totalCount: result?.totalCount ?? 0,
      };
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

  // --- Shared DataGrid: config-driven columns (same fields/formats as the previous
  //     hand-written dx-data-grid) ---
  columns: dataGridColumnDto[] = [
    { dataField: 'deliveryNumber', dataType: 'string', caption: 'DELIVERY_SCHEDULE.DELIVERY_NUMBER' },
    { dataField: 'customerName', dataType: 'string', caption: 'REQUESTED_CARS.CUSTOMER' },
    { dataField: 'carDescription', dataType: 'string', caption: 'DAILY_ENTRIES.VEHICLE' },
    { dataField: 'carVin', dataType: 'string', caption: 'CONSIGNMENT.VIN', width: 150 },
    { dataField: 'driverName', dataType: 'string', caption: 'DELIVERY_SCHEDULE.DRIVER' },
    { dataField: 'deliveryDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'DELIVERY_SCHEDULE.DELIVERY_DATE', width: 120 },
    { dataField: 'deliveryTime', dataType: 'string', caption: 'DELIVERY_SCHEDULE.DELIVERY_TIME', width: 100 },
    { dataField: 'branchName', dataType: 'string', caption: 'DELIVERY_SCHEDULE.BRANCH' },
    { dataField: 'status', dataType: 'string', caption: 'DELIVERY_SCHEDULE.STATUS', width: 130, cellTemplate: 'statusTemplate' },
    { dataField: 'deliveryProgress', dataType: 'number', caption: 'DELIVERY_SCHEDULE.PROGRESS', width: 110, cellTemplate: 'progressTemplate' },
    { dataField: 'documentsReady', dataType: 'boolean', caption: 'DELIVERY_SCHEDULE.DOCUMENTS_READY', width: 110 },
    { dataField: 'insuranceReady', dataType: 'boolean', caption: 'DELIVERY_SCHEDULE.INSURANCE_READY', width: 110 },
    { dataField: 'registrationReady', dataType: 'boolean', caption: 'DELIVERY_SCHEDULE.REGISTRATION_READY', width: 120 },
    { dataField: 'customerConfirmed', dataType: 'boolean', caption: 'DELIVERY_SCHEDULE.CUSTOMER_CONFIRMED', width: 130 },
    { dataField: 'notes', dataType: 'string', caption: 'REQUESTED_CARS.NOTES', visible: false },
    { dataField: '__actions', dataType: 'string', caption: 'COMMON.ACTIONS', type: 'actions', width: 120, allowSorting: false, allowFiltering: false },
  ];

  /** Same permission-gated actions as before (*appHasPermission), now expressed as
   *  per-row visibility predicates on the Shared DataGrid's actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('deliverySchedule.edit') },
    { id: 'history', icon: 'history', labelKey: 'AUDIT_HISTORY.TITLE', visible: () => this.permissionService.hasPermission('deliverySchedule.history') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('deliverySchedule.delete') },
  ];

  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  private progressTpl = viewChild<TemplateRef<any>>('progressTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    const progress = this.progressTpl();
    return {
      ...(status ? { statusTemplate: status } : {}),
      ...(progress ? { progressTemplate: progress } : {}),
    };
  }

  onGridAction(e: SharedGridRowActionEvent): void {
    const row = e.row as DeliverySchedule;
    if (e.actionId === 'edit') this.editDelivery(row.id);
    else if (e.actionId === 'history') this.openHistory(row.id);
    else if (e.actionId === 'delete') this.requestDelete(row.id);
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
    this.grid?.refresh();
    this.deliveryService.loadDataGrid({ take: 10000 }).subscribe(result => {
      this.lastLoadedRows.set(result.data);
    });
  }

  onStatusFilterChange(): void {
    this.refresh();
  }

  resetFilters(): void {
    this.statusFilter.set('');
    this.grid?.getInstance()?.clearFilter();
    this.refresh();
  }

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('DeliverySchedule');
        exportDataGrid({
          component,
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
    const component = this.grid?.getInstance();
    if (!component) return;
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component,
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
      panelClass: 'responsive-dialog-panel',
    });
  }
}
