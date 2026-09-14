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
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

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
    SharedDataGridComponent,
    SharedMobileListComponent
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
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  canCreate = computed(() => this.permissionService.hasPermission('paymentmethod.create'));

  paymentMethods = signal<PaymentMethod[]>([]);
  loading = signal(false);
  mobileSearch = signal('');

  /** Client-side search for the mobile card list (desktop keeps DevExtreme's own search panel). */
  filteredPaymentMethods = computed(() => {
    const term = this.mobileSearch().toLowerCase();
    const methods = this.paymentMethods();
    if (!term) return methods;
    return methods.filter(m =>
      m.nameAr?.toLowerCase().includes(term) ||
      m.nameEn?.toLowerCase().includes(term) ||
      m.paymentType?.toLowerCase().includes(term)
    );
  });

  columns: dataGridColumnDto[] = [
    { dataField: 'nameAr', dataType: 'string', caption: 'PAYMENT_METHOD.NAME_AR' },
    { dataField: 'nameEn', dataType: 'string', caption: 'PAYMENT_METHOD.NAME_EN' },
    {
      dataField: 'paymentType',
      dataType: 'string',
      caption: 'PAYMENT_METHOD.PAYMENT_TYPE',
      width: 140,
      calculateDisplayValue: (m: PaymentMethod) => this.translate.instant('PAYMENT_METHOD.TYPES.' + m.paymentType),
    },
    { dataField: 'accountCode', dataType: 'string', caption: 'PAYMENT_METHOD.ACCOUNT_CODE', width: 120 },
    { dataField: 'accountNameEn', dataType: 'string', caption: 'PAYMENT_METHOD.ACCOUNT' },
    { dataField: 'isActive', dataType: 'boolean', caption: 'COMMON.ACTIVE', width: 110, type: 'status' },
    {
      // Which Payment Method is currently the scope's default (at most one active row shows the
      // badge; the backend guarantees uniqueness by clearing the previous default on change).
      dataField: 'isDefault',
      dataType: 'boolean',
      caption: 'PAYMENT_METHOD.IS_DEFAULT',
      width: 110,
      type: 'status',
      trueText: 'PAYMENT_METHOD.DEFAULT_BADGE',
      falseText: '—',
      allowSorting: false,
      statusClass: (m: PaymentMethod) => (m.isDefault ? 'success' : 'neutral'),
    },
  ];

  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('paymentmethod.edit') },
    {
      id: 'toggleActive',
      icon: 'toggle_on',
      labelKey: 'PAYMENT_METHOD.TOGGLE_ACTIVE',
      visible: () => this.permissionService.hasPermission('paymentmethod.edit')
    },
    {
      id: 'setDefault',
      icon: 'star',
      labelKey: 'PAYMENT_METHOD.SET_DEFAULT',
      // Only ACTIVE methods are eligible, and the current default needs no action.
      visible: (row: PaymentMethod) =>
        this.permissionService.hasPermission('paymentmethod.edit') && !!row?.isActive && !row?.isDefault
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

  /** Marks this Payment Method as THE default for the scope; the backend clears the previous
   *  default's flag in the same transaction, so only one default can ever exist. */
  onSetDefault = (e: any): void => {
    const method: PaymentMethod = e.row.data;
    // Defensive re-check for entry points without per-row visibility (mobile list keeps the
    // action but must refuse inactive or already-default methods).
    if (!method.isActive) {
      this.notificationService.showWarning(this.translate.instant('PAYMENT_METHOD.ONLY_ACTIVE_CAN_BE_DEFAULT'));
      return;
    }
    if (method.isDefault) {
      this.notificationService.showInfo(this.translate.instant('PAYMENT_METHOD.ALREADY_DEFAULT', { name: method.nameEn || method.nameAr }));
      return;
    }

    this.paymentMethodService.setDefault(method.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('PAYMENT_METHOD.SET_DEFAULT_SUCCESS', { name: method.nameEn || method.nameAr }));
        this.loadPaymentMethods();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('PAYMENT_METHOD.SAVE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'toggleActive') this.onToggleActive(wrapped);
    else if (e.actionId === 'setDefault') this.onSetDefault(wrapped);
    else if (e.actionId === 'delete') this.onDelete(wrapped);
  }

  /** Same field set as the desktop grid's visible columns, for the mobile card list. */
  mobileFields: MobileListFieldDto<PaymentMethod>[] = [
    { label: 'PAYMENT_METHOD.NAME_EN', value: (m) => m.nameEn },
    { label: 'PAYMENT_METHOD.PAYMENT_TYPE', value: (m) => this.translate.instant('PAYMENT_METHOD.TYPES.' + m.paymentType) },
    { label: 'PAYMENT_METHOD.ACCOUNT_CODE', value: (m) => m.accountCode },
    { label: 'PAYMENT_METHOD.ACCOUNT', value: (m) => m.accountNameEn },
    {
      // Shown only on the card of the method that IS the default, as a success badge.
      label: 'PAYMENT_METHOD.IS_DEFAULT',
      value: (m) => this.translate.instant('PAYMENT_METHOD.DEFAULT_BADGE'),
      type: 'status',
      statusClass: () => 'success',
      visible: (m) => !!m.isDefault,
    },
    {
      label: 'COMMON.ACTIVE',
      value: (m) => this.translate.instant(m.isActive ? 'COMMON.ACTIVE' : 'COMMON.INACTIVE'),
      type: 'status',
      statusClass: (m) => (m.isActive ? 'success' : 'neutral'),
    },
  ];

  /** Same edit/toggleActive/setDefault/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<PaymentMethod>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('paymentmethod.edit') },
    {
      id: 'toggleActive',
      icon: 'toggle_on',
      labelKey: 'PAYMENT_METHOD.TOGGLE_ACTIVE',
      visible: () => this.permissionService.hasPermission('paymentmethod.edit')
    },
    {
      id: 'setDefault',
      icon: 'star',
      labelKey: 'PAYMENT_METHOD.SET_DEFAULT',
      // Only ACTIVE methods are eligible, and the current default needs no action.
      visible: (m: PaymentMethod) =>
        this.permissionService.hasPermission('paymentmethod.edit') && !!m?.isActive && !m?.isDefault
    },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('paymentmethod.delete') },
  ];

  mobileTitleOf = (m: PaymentMethod) => m.nameAr;
  mobileTrackBy = (index: number, m: PaymentMethod) => m.id ?? index;

  onMobileAction(e: MobileListActionEvent<PaymentMethod>): void {
    const wrapped = { row: { data: e.item } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'toggleActive') this.onToggleActive(wrapped);
    else if (e.actionId === 'setDefault') this.onSetDefault(wrapped);
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
