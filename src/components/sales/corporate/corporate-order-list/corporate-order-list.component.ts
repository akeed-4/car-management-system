import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateOrder } from '../../../../models/corporate/corporate-order.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-corporate-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './corporate-order-list.component.html',
  styleUrls: ['./corporate-order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateOrderListComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  orders = signal<CorporateOrder[]>([]);
  loading = signal(false);

  /** Screen-specific status badge, passed generically to the Shared DataGrid. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/formats as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'id', dataType: 'number', caption: 'CORPORATE.ORDER_NUMBER', width: 90 },
    { dataField: 'customerName', dataType: 'string', caption: 'CORPORATE.CUSTOMER' },
    { dataField: 'customerPoReference', dataType: 'string', caption: 'CORPORATE.PO_REFERENCE' },
    { dataField: 'orderDate', dataType: 'date', caption: 'CORPORATE.ORDER_DATE' },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'INVOICE.TOTAL' },
    { dataField: 'status', dataType: 'string', caption: 'CORPORATE.ORDER_STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView(e.row);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.corporateFleetService.getOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.ORDERS_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/orders/new']);
  }

  onView = (e: any): void => {
    const id = (e?.row?.data ?? e)?.id;
    this.router.navigate(['/sales/corporate/orders/view', id]);
  };
}
