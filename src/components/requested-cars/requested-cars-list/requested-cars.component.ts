import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, signal, viewChild, ViewChild } from '@angular/core';
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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { RequestedCarService } from '../../../services/requested-car.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { RequestedCarAiPanelComponent } from '../requested-car-ai-panel/requested-car-ai-panel.component';
import { RequestedCar } from '../../../models/requested-car.model';
import { getStatusClass, getPriorityClass, getReservationStatusClass } from '../requested-car-status.util';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

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
    SharedDataGridComponent,
    TranslateModule,
  ],
  templateUrl: './requested-cars.component.html',
  styleUrl: './requested-cars.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestedCarsComponent {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private requestedCarService = inject(RequestedCarService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

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

  // --- Shared DataGrid: config-driven columns (same fields/fixed positions/visibility
  //     as the previous hand-written dx-data-grid) ---
  columns: dataGridColumnDto[] = [
    { dataField: 'requestNumber', dataType: 'string', caption: 'REQUESTED_CARS.REQUEST_NUMBER', width: 130, fixed: true },
    { dataField: 'requestDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'REQUESTED_CARS.REQUEST_DATE', width: 120 },
    { dataField: 'customerName', dataType: 'string', caption: 'REQUESTED_CARS.CUSTOMER' },
    { dataField: 'customerPhone', dataType: 'string', caption: 'REQUESTED_CARS.CUSTOMER_PHONE', width: 130 },
    { dataField: 'salespersonName', dataType: 'string', caption: 'REQUESTED_CARS.SALESPERSON' },
    { dataField: 'make', dataType: 'string', caption: 'REQUESTED_CARS.BRAND' },
    { dataField: 'model', dataType: 'string', caption: 'REQUESTED_CARS.MODEL' },
    { dataField: 'year', dataType: 'number', caption: 'REQUESTED_CARS.YEAR', width: 90, alignment: 'center' },
    { dataField: 'color', dataType: 'string', caption: 'REQUESTED_CARS.COLOR', width: 110 },
    { dataField: 'preferredSpecifications', dataType: 'string', caption: 'REQUESTED_CARS.PREFERRED_SPECS', visible: false },
    { dataField: 'priority', dataType: 'string', caption: 'REQUESTED_CARS.PRIORITY', width: 120, cellTemplate: 'priorityTemplate' },
    { dataField: 'expectedArrival', dataType: 'date', format: 'yyyy-MM-dd', caption: 'REQUESTED_CARS.EXPECTED_ARRIVAL', width: 130 },
    { dataField: 'status', dataType: 'string', caption: 'REQUESTED_CARS.STATUS', width: 130, cellTemplate: 'statusTemplate' },
    { dataField: 'reservationStatus', dataType: 'string', caption: 'REQUESTED_CARS.RESERVATION_STATUS', width: 140, cellTemplate: 'reservationTemplate' },
    { dataField: 'notes', dataType: 'string', caption: 'REQUESTED_CARS.NOTES', visible: false },
    { dataField: 'createdAt', dataType: 'datetime', caption: 'REQUESTED_CARS.CREATED_DATE', visible: false },
    { dataField: '__actions', dataType: 'string', caption: 'COMMON.ACTIONS', type: 'actions', width: 160, fixed: true, allowSorting: false, allowFiltering: false },
  ];

  /** Same permission-gated actions as before (*appHasPermission), now expressed as
   *  per-row visibility predicates on the Shared DataGrid's actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('requestedCar.edit') },
    { id: 'history', icon: 'history', labelKey: 'AUDIT_HISTORY.TITLE', visible: () => this.permissionService.hasPermission('requestedCar.history') },
    { id: 'ai', icon: 'auto_awesome', labelKey: 'REQUESTED_CARS.AI_PANEL.TITLE', visible: () => this.permissionService.hasPermission('requestedCar.ai') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('requestedCar.delete') },
  ];

  summaryItems: any[] = [
    { column: 'requestNumber', summaryType: 'count', displayFormat: '{0}' },
  ];

  private priorityTpl = viewChild<TemplateRef<any>>('priorityTemplate');
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  private reservationTpl = viewChild<TemplateRef<any>>('reservationTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const priority = this.priorityTpl();
    const status = this.statusTpl();
    const reservation = this.reservationTpl();
    return {
      ...(priority ? { priorityTemplate: priority } : {}),
      ...(status ? { statusTemplate: status } : {}),
      ...(reservation ? { reservationTemplate: reservation } : {}),
    };
  }

  onGridAction(e: SharedGridRowActionEvent): void {
    const row = e.row as RequestedCar;
    if (e.actionId === 'edit') this.editRequest(row.id);
    else if (e.actionId === 'history') this.openHistory(row.id);
    else if (e.actionId === 'ai') this.openAiPanel(row);
    else if (e.actionId === 'delete') this.requestDelete(row.id);
  }

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
    this.grid?.refresh();
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
    this.grid?.getInstance()?.clearFilter();
    this.refresh();
  }

  exportExcel(): void {
    const component = this.grid?.getInstance();
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('RequestedCars');
        exportDataGrid({
          component,
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
    const component = this.grid?.getInstance();
    if (!component) return;
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component,
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
