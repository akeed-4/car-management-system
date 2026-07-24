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
import { FormsModule } from '@angular/forms';
import CustomStore from 'devextreme/data/custom_store';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { TenantDto } from '../../../../models/platform/tenant.model';
import { TenantStatus, TenantStatusHelper } from '../../../../models/enums/platform.enums';
import { getTenantStatusClass } from '../tenant-status.util';

@Component({
  selector: 'app-tenant-list',
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
    DxDataGridModule,
    TranslateModule,
  ],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantListComponent {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

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

  newTenant(): void {
    this.router.navigate(['/platform/companies/new']);
  }

  editTenant(id: number): void {
    this.router.navigate(['/platform/companies/edit', id]);
  }

  openDetails(e: { data?: TenantDto }): void {
    if (e.data) {
      this.editTenant(e.data.id);
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
    this.grid?.instance?.refresh();
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
        const worksheet = workbook.addWorksheet('Tenants');
        exportDataGrid({
          component: this.grid.instance,
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
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component: this.grid.instance,
      }).then(() => {
        doc.save('Tenants.pdf');
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
