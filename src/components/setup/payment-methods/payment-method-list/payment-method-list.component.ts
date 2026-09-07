import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { PaymentMethodService } from '../../../../services/payment-method.service';
import { NotificationService } from '../../../../services/notification.service';
import { PaymentMethod } from '../../../../models/payment-method.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';

@Component({
  selector: 'app-payment-method-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
    SharedDataGridComponent
  ],
  templateUrl: './payment-method-list.component.html',
  styleUrls: ['./payment-method-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentMethodListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private paymentMethodService = inject(PaymentMethodService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

  canCreate = computed(() => this.permissionService.hasPermission('paymentmethod.create'));

  paymentMethods = signal<PaymentMethod[]>([]);
  loading = signal(false);

  columns: dataGridColumnDto[] = [
    { dataField: 'nameAr', dataType: 'string', caption: 'PAYMENT_METHOD.NAME_AR' },
    { dataField: 'nameEn', dataType: 'string', caption: 'PAYMENT_METHOD.NAME_EN' },
    { dataField: 'paymentType', dataType: 'string', caption: 'PAYMENT_METHOD.PAYMENT_TYPE', width: 140 },
    { dataField: 'accountCode', dataType: 'string', caption: 'PAYMENT_METHOD.ACCOUNT_CODE', width: 120 },
    { dataField: 'accountNameEn', dataType: 'string', caption: 'PAYMENT_METHOD.ACCOUNT' },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
  ];

  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('paymentmethod.edit') },
    {
      id: 'toggleActive',
      icon: 'toggle_on',
      labelKey: 'PAYMENT_METHOD.TOGGLE_ACTIVE',
      visible: () => this.permissionService.hasPermission('paymentmethod.edit')
    },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('paymentmethod.delete') },
  ];

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.loading.set(true);
    this.paymentMethodService.getAll().subscribe({
      next: (data) => {
        this.paymentMethods.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('PAYMENT_METHOD.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadPaymentMethods();
  }

  onCreate(): void {
    this.router.navigate(['/entities/payment-methods/new']);
  }

  onEdit = (e: any): void => {
    this.router.navigate(['/entities/payment-methods/edit', e.row.data.id]);
  };

  onToggleActive = (e: any): void => {
    const method: PaymentMethod = e.row.data;
    this.paymentMethodService.setActive(method.id, !method.isActive).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('PAYMENT_METHOD.STATUS_UPDATE_SUCCESS'));
        this.loadPaymentMethods();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('PAYMENT_METHOD.SAVE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  onDelete = (e: any): void => {
    const method: PaymentMethod = e.row.data;
    const message = this.translate.instant('PAYMENT_METHOD.CONFIRM_DELETE', { name: method.nameEn });
    if (!confirm(message)) return;

    this.paymentMethodService.delete(method.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('PAYMENT_METHOD.DELETE_SUCCESS'));
        this.loadPaymentMethods();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('PAYMENT_METHOD.DELETE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'toggleActive') this.onToggleActive(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  exportExcel(): void {
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PaymentMethods');
        exportDataGrid({ component: this.grid.getInstance(), worksheet }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'PaymentMethods.xlsx');
            });
          });
        });
      });
    });
  }

  printGrid(): void {
    window.print();
  }
}
