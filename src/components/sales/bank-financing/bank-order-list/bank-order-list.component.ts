import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-bank-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './bank-order-list.component.html',
  styleUrls: ['./bank-order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankOrderListComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);
  permissionService = inject(PermissionService);

  orders = signal<BankQuotation[]>([]);
  loading = signal(false);

  /** Config-driven columns -- same fields/captions as before (status renders
   *  as plain text, no badge, matching the original grid). */
  columns: dataGridColumnDto[] = [
    { dataField: 'orderNumber', dataType: 'string', caption: 'BANK_FINANCING.ORDER_NUMBER' },
    { dataField: 'orderDate', dataType: 'date', caption: 'BANK_FINANCING.ORDER_DATE' },
    { dataField: 'quotationNumber', dataType: 'string', caption: 'CORPORATE.QUOTATION_NUMBER' },
    { dataField: 'endUserName', dataType: 'string', caption: 'BANK_FINANCING.END_USER_NAME' },
    { dataField: 'bankName', dataType: 'string', caption: 'BANK_FINANCING.BANK' },
    { dataField: 'vin', dataType: 'string', caption: 'VIN' },
    { dataField: 'approvedFinancingAmount', dataType: 'number', format: 'currency', caption: 'BANK_FINANCING.APPROVED_FINANCING_AMOUNT' },
    { dataField: 'status', dataType: 'string', caption: 'BANK_FINANCING.STATUS' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW', visible: () => this.permissionService.hasPermission('sales.bank.orders.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView({ row: { data: e.row } });
  }

  /** Row double-click opens the record -- same behavior, adapted to the shared output. */
  onGridRowDblClick(row: any): void {
    this.onView({ row: { data: row } });
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.bankFinancingService.getAllOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDERS_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/orders/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/bank/orders/view', id]);
  };

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: BankQuotation) => item.orderNumber ?? item.quotationNumber;
  mobileTrackBy = (_index: number, item: BankQuotation) => item.id;

  mobileFields: MobileCardField<BankQuotation>[] = [
    { label: 'BANK_FINANCING.ORDER_DATE', value: (item) => item.orderDate ? this.datePipe.transform(item.orderDate, 'yyyy-MM-dd') : '' },
    { label: 'CORPORATE.QUOTATION_NUMBER', value: (item) => item.quotationNumber },
    { label: 'BANK_FINANCING.END_USER_NAME', value: (item) => item.endUserName },
    { label: 'BANK_FINANCING.BANK', value: (item) => item.bankName },
    { label: 'VIN', value: (item) => item.vin },
    { label: 'BANK_FINANCING.APPROVED_FINANCING_AMOUNT', value: (item) => item.approvedFinancingAmount != null ? this.currencyPipe.transform(item.approvedFinancingAmount, 'SAR') : '' },
    { label: 'BANK_FINANCING.STATUS', value: (item) => item.status },
  ];

  mobileView(item: BankQuotation): void {
    this.onView({ row: { data: item } });
  }
}
