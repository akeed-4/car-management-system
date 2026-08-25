import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewChild, viewChild, TemplateRef } from '@angular/core';
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
import { DailyEntryService } from '../../../services/daily-entry.service';
import { PermissionService } from '../../../services/permission.service';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { DailyEntry } from '../../../models/daily-entry.model';
import { getDailyEntryStatusClass, getDailyEntryTypeClass } from '../daily-entry-status.util';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-daily-entries-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
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
    MobileCardListComponent,
  ],
  templateUrl: './daily-entries-list.component.html',
  styleUrl: './daily-entries-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyEntriesListComponent {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private dailyEntryService = inject(DailyEntryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private responsiveService = inject(ResponsiveService);
  private translateService = inject(TranslateService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  typeFilter = signal<string>('');
  statusFilter = signal<string>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<DailyEntry[]>([]);

  readonly gridStateKey = 'dailyEntriesGridState';

  typeOptions = ['Receiving', 'Delivery', 'Transfer', 'Return', 'Inspection', 'Maintenance'];
  statusOptions = ['Pending', 'Completed', 'Cancelled'];

  /** Screen-specific badge renderers passed generically to the Shared DataGrid. */
  private typeTpl = viewChild<TemplateRef<any>>('typeTemplate');
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const type = this.typeTpl();
    const status = this.statusTpl();
    return {
      ...(type ? { typeTemplate: type } : {}),
      ...(status ? { statusTemplate: status } : {}),
    };
  }

  /** Config-driven columns -- same fields/fixed positions/visibility as before
   *  (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'referenceNumber', dataType: 'string', caption: 'DAILY_ENTRIES.REFERENCE_NUMBER', width: 130, fixed: true },
    { dataField: 'entryType', dataType: 'string', caption: 'DAILY_ENTRIES.ENTRY_TYPE', width: 130, cellTemplate: 'typeTemplate' },
    { dataField: 'carDescription', dataType: 'string', caption: 'DAILY_ENTRIES.VEHICLE' },
    { dataField: 'carVin', dataType: 'string', caption: 'CONSIGNMENT.VIN', width: 150 },
    { dataField: 'storeName', dataType: 'string', caption: 'DAILY_ENTRIES.WAREHOUSE' },
    { dataField: 'employeeName', dataType: 'string', caption: 'DAILY_ENTRIES.EMPLOYEE' },
    { dataField: 'entryDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'DAILY_ENTRIES.ENTRY_DATE', width: 120 },
    { dataField: 'status', dataType: 'string', caption: 'DAILY_ENTRIES.STATUS', width: 130, cellTemplate: 'statusTemplate' },
    { dataField: 'remarks', dataType: 'string', caption: 'DAILY_ENTRIES.REMARKS', visible: false },
    { dataField: 'createdAt', dataType: 'datetime', caption: 'REQUESTED_CARS.CREATED_DATE', visible: false },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'COMMON.ACTIONS', width: 120, fixed: true, allowSorting: false, allowFiltering: false },
  ];

  /** Permission-gated actions -- same appHasPermission rules as before, now
   *  expressed through per-row visibility predicates. */
  rowActions: sharedGridRowActionDto[] = [
    {
      id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT',
      visible: () => this.permissionService.hasPermission('dailyEntry.edit'),
    },
    {
      id: 'history', icon: 'history', labelKey: 'AUDIT_HISTORY.TITLE',
      visible: () => this.permissionService.hasPermission('dailyEntry.history'),
    },
    {
      id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn',
      visible: () => this.permissionService.hasPermission('dailyEntry.delete'),
    },
  ];

  /** Same count total as before (referenceNumber column). */
  summaryItems: any[] = [
    { column: 'referenceNumber', summaryType: 'count', displayFormat: '{0}' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const entry = e.row as DailyEntry;
    if (e.actionId === 'edit') this.editEntry(entry.id);
    else if (e.actionId === 'history') this.openHistory(entry.id);
    else if (e.actionId === 'delete') this.requestDelete(entry.id);
  }

  dataSource = new CustomStore<DailyEntry>({
    key: 'id',
    load: async (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      const filters: unknown[] = [];
      if (this.typeFilter()) filters.push(['entryType', '=', this.typeFilter()]);
      if (this.statusFilter()) filters.push(['status', '=', this.statusFilter()]);
      if (filters.length > 0) {
        const existing = options['filter'];
        const combined = filters.length === 1 ? filters[0] : filters.flatMap((f, i) => i === 0 ? [f] : ['and', f]);
        options['filter'] = existing ? [existing, 'and', combined] : combined;
      }

      const result = await firstValueFrom(this.dailyEntryService.loadDataGrid(options));
      this.lastLoadedRows.set(result?.data ?? []);
      return {
        data: result?.data ?? [],
        totalCount: result?.totalCount ?? 0,
      };
    },
  });

  constructor() {
    // dataSource.load() previously only ever fired via the grid's own [dataSource] binding --
    // fine when the grid always mounts, but on mobile it doesn't (see @if(isMobile()) in the
    // template), which would leave lastLoadedRows (and the mobile card list built on it) empty.
    // Force an initial load unconditionally so both views work regardless of which one renders.
    this.dataSource.load();
  }

  summary = computed(() => {
    const rows = this.lastLoadedRows();
    const today = new Date().toISOString().split('T')[0];
    return {
      total: rows.length,
      today: rows.filter(r => r.entryDate?.startsWith(today)).length,
      pending: rows.filter(r => r.status === 'Pending').length,
      completed: rows.filter(r => r.status === 'Completed').length,
    };
  });

  getDailyEntryStatusClass = getDailyEntryStatusClass;
  getDailyEntryTypeClass = getDailyEntryTypeClass;

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: DailyEntry) => item.referenceNumber;
  mobileTrackBy = (_index: number, item: DailyEntry) => item.id;

  mobileFields: MobileCardField<DailyEntry>[] = [
    { label: 'DAILY_ENTRIES.ENTRY_TYPE', value: (item) => this.translateService.instant('DAILY_ENTRIES.TYPE_' + item.entryType?.toUpperCase()) },
    { label: 'DAILY_ENTRIES.VEHICLE', value: (item) => item.carDescription },
    { label: 'DAILY_ENTRIES.WAREHOUSE', value: (item) => item.storeName },
    { label: 'DAILY_ENTRIES.EMPLOYEE', value: (item) => item.employeeName },
    { label: 'DAILY_ENTRIES.ENTRY_DATE', value: (item) => item.entryDate ? new Date(item.entryDate).toLocaleDateString() : '' },
    { label: 'DAILY_ENTRIES.STATUS', value: (item) => this.translateService.instant('DAILY_ENTRIES.STATUS_' + item.status?.toUpperCase()) },
  ];

  mobileEdit(item: DailyEntry): void {
    this.editEntry(item.id);
  }

  mobileHistory(item: DailyEntry): void {
    this.openHistory(item.id);
  }

  mobileDelete(item: DailyEntry): void {
    this.requestDelete(item.id);
  }

  newEntry(): void {
    this.router.navigate(['/daily-entries/new']);
  }

  editEntry(id: number): void {
    this.router.navigate(['/daily-entries', id, 'edit']);
  }

  openDetails(entry?: DailyEntry): void {
    if (entry) {
      this.editEntry(entry.id);
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.dailyEntryService.delete(id).subscribe(() => {
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

  onFilterChange(): void {
    this.refresh();
  }

  resetFilters(): void {
    this.typeFilter.set('');
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
        const worksheet = workbook.addWorksheet('DailyEntries');
        exportDataGrid({
          component,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DailyEntries.xlsx');
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
        doc.save('DailyEntries.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }

  openHistory(id: number): void {
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'DailyEntry', entityId: id },
      width: '600px',
      panelClass: 'responsive-dialog-panel',
    });
  }
}
