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
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { TenantDto } from '../../../../models/platform/tenant.model';
import { TenantStatus, TenantStatusHelper } from '../../../../models/enums/platform.enums';
import { getTenantStatusClass } from '../tenant-status.util';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-tenant-list',
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
    SharedDataGridComponent,
    TranslateModule,
    SharedMobileListComponent,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantListComponent {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private responsiveService = inject(ResponsiveService);
  private translate = inject(TranslateService);
  isMobile = this.responsiveService.isMobile;

  statusFilter = signal<TenantStatus | ''>('');

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  lastLoadedRows = signal<TenantDto[]>([]);

  readonly gridStateKey = 'platformTenantsGridState';
  readonly statusOptions = TenantStatusHelper.getAll();
  readonly TenantStatus = TenantStatus;

  dataSource = new CustomStore<TenantDto>({
    key: 'id',
    load: async (loadOptions) => {
      const options: Record<string, unknown> = { ...loadOptions };

      if (this.statusFilter() !== '') {
        const statusFilterExpr = ['status', '=', this.statusFilter()];
        const existing = options['filter'];
        options['filter'] = existing ? [existing, 'and', statusFilterExpr] : statusFilterExpr;
      }

      const result = await firstValueFrom(this.platformService.loadTenantsGrid(options));
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
      total: rows.length,
      active: rows.filter(r => r.status === TenantStatus.Active).length,
      provisioning: rows.filter(r => r.status === TenantStatus.Provisioning).length,
      suspended: rows.filter(r => r.status === TenantStatus.Suspended || r.status === TenantStatus.Blocked).length,
    };
  });

  getTenantStatusClass = getTenantStatusClass;

  /** Screen-specific badge renderer passed generically to the Shared DataGrid. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/fixed positions as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'code', dataType: 'string', caption: 'PLATFORM.TENANTS.CODE', width: 110, fixed: true },
    { dataField: 'name', dataType: 'string', caption: 'PLATFORM.TENANTS.COMPANY' },
    { dataField: 'adminFullName', dataType: 'string', caption: 'PLATFORM.TENANTS.OWNER' },
    { dataField: 'adminEmail', dataType: 'string', caption: 'PLATFORM.TENANTS.EMAIL' },
    { dataField: 'phone', dataType: 'string', caption: 'PLATFORM.TENANTS.PHONE', width: 130 },
    { dataField: 'planName', dataType: 'string', caption: 'PLATFORM.TENANTS.PLAN', width: 130 },
    { dataField: 'status', dataType: 'string', caption: 'PLATFORM.TENANTS.STATUS', width: 130, cellTemplate: 'statusTemplate' },
    { dataField: 'createdAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PLATFORM.TENANTS.CREATED', width: 120 },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'COMMON.ACTIONS', width: 150, fixed: true, allowSorting: false, allowFiltering: false },
  ];

  /** Permission-gated actions -- the suspend/resume pair replaces the old
   *  dynamic-icon button using the built-in per-row visibility support. */
  rowActions: sharedGridRowActionDto[] = [
    {
      id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT',
      visible: () => this.permissionService.hasPermission('platform.tenants.edit'),
    },
    {
      id: 'suspend', icon: 'pause_circle', labelKey: 'PLATFORM.TENANTS.TOGGLE_SUSPEND',
      visible: (row: TenantDto) =>
        this.permissionService.hasPermission('platform.tenants.suspend') && row.status !== TenantStatus.Suspended,
    },
    {
      id: 'resume', icon: 'play_circle', labelKey: 'PLATFORM.TENANTS.TOGGLE_SUSPEND',
      visible: (row: TenantDto) =>
        this.permissionService.hasPermission('platform.tenants.suspend') && row.status === TenantStatus.Suspended,
    },
    {
      id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn',
      visible: () => this.permissionService.hasPermission('platform.tenants.delete'),
    },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const tenant = e.row as TenantDto;
    if (e.actionId === 'edit') this.editTenant(tenant.id);
    else if (e.actionId === 'suspend' || e.actionId === 'resume') this.toggleSuspend(tenant);
    else if (e.actionId === 'delete') this.requestDelete(tenant.id);
  }

  /** Same field set as the desktop grid's visible columns, for the mobile card list. */
  mobileFields: MobileListFieldDto<TenantDto>[] = [
    { label: 'PLATFORM.TENANTS.OWNER', value: (t) => t.adminFullName },
    { label: 'PLATFORM.TENANTS.EMAIL', value: (t) => t.adminEmail },
    { label: 'PLATFORM.TENANTS.PHONE', value: (t) => t.phone },
    { label: 'PLATFORM.TENANTS.PLAN', value: (t) => t.planName },
    {
      label: 'PLATFORM.TENANTS.STATUS',
      value: (t) => this.translateTenantStatus(t.status),
      type: 'status',
      statusClass: (t) =>
        t.status === TenantStatus.Active ? 'success' :
        t.status === TenantStatus.Provisioning ? 'warning' :
        'danger',
    },
  ];

  /** Same edit/suspend/resume/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<TenantDto>[] = [
    {
      id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT',
      visible: () => this.permissionService.hasPermission('platform.tenants.edit'),
    },
    {
      id: 'suspend', icon: 'pause_circle', labelKey: 'PLATFORM.TENANTS.TOGGLE_SUSPEND',
      visible: (row: TenantDto) =>
        this.permissionService.hasPermission('platform.tenants.suspend') && row.status !== TenantStatus.Suspended,
    },
    {
      id: 'resume', icon: 'play_circle', labelKey: 'PLATFORM.TENANTS.TOGGLE_SUSPEND',
      visible: (row: TenantDto) =>
        this.permissionService.hasPermission('platform.tenants.suspend') && row.status === TenantStatus.Suspended,
    },
    {
      id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'btn-danger',
      visible: () => this.permissionService.hasPermission('platform.tenants.delete'),
    },
  ];

  mobileTitleOf = (t: TenantDto) => t.name;
  mobileTrackBy = (index: number, t: TenantDto) => t.id ?? index;

  onMobileAction(e: MobileListActionEvent<TenantDto>): void {
    const tenant = e.item;
    if (e.actionId === 'edit') this.editTenant(tenant.id);
    else if (e.actionId === 'suspend' || e.actionId === 'resume') this.toggleSuspend(tenant);
    else if (e.actionId === 'delete') this.requestDelete(tenant.id);
  }

  /** Mirrors the desktop grid's inline #statusTemplate label mapping. */
  private translateTenantStatus(status: TenantStatus): string {
    const key = status === TenantStatus.Active ? 'ACTIVE'
      : status === TenantStatus.Provisioning ? 'PROVISIONING'
      : status === TenantStatus.Suspended ? 'SUSPENDED'
      : 'BLOCKED';
    return this.translate.instant('PLATFORM.TENANT_STATUS.' + key);
  }

  newTenant(): void {
    this.router.navigate(['/platform/companies/new']);
  }

  editTenant(id: number): void {
    this.router.navigate(['/platform/companies/edit', id]);
  }

  openDetails(tenant?: TenantDto): void {
    if (tenant) {
      this.editTenant(tenant.id);
    }
  }

  toggleSuspend(tenant: TenantDto): void {
    const nextStatus = tenant.status === TenantStatus.Suspended ? TenantStatus.Active : TenantStatus.Suspended;
    this.platformService.updateTenant(tenant.id, { status: nextStatus }).subscribe({
      next: () => {
        this.notificationService.showSuccess('TOAST.EDIT_SUCCESS');
        this.refresh();
      },
      error: () => this.notificationService.showError('TOAST.SAVE_ERROR'),
    });
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.platformService.deleteTenant(id).subscribe({
        next: () => {
          this.notificationService.showSuccess('TOAST.DELETE_SUCCESS');
          this.refresh();
        },
        error: () => this.notificationService.showError('TOAST.DELETE_ERROR'),
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
        const worksheet = workbook.addWorksheet('Tenants');
        exportDataGrid({
          component,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Tenants.xlsx');
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
        doc.save('Tenants.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
