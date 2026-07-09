import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RetailSalesOrderService } from '../../../../services/retail-sales-order.service';
import { NotificationService } from '../../../../services/notification.service';
import { RetailSalesOrderDto } from '../../../../models/retail-sales-order.model';

@Component({
  selector: 'app-retail-sales-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './retail-sales-order-list.component.html',
  styleUrls: ['./retail-sales-order-list.component.css']
})
export class RetailSalesOrderListComponent implements OnInit {
  orders: RetailSalesOrderDto[] = [];

  constructor(
    private retailSalesOrderService: RetailSalesOrderService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.retailSalesOrderService.getAll().subscribe({
      next: (orders: any) => {
        this.orders = Array.isArray(orders) ? orders : (orders?.data ?? []);
      },
      error: (err) => {
        console.error('Error loading sales orders', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/direct/orders/new']);
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/sales/direct/orders/view', id]);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/sales/direct/orders/edit', id]);
  }

  getLinesCount(rowData: RetailSalesOrderDto): number {
    return rowData.lines ? rowData.lines.length : 0;
  }

  isDraft = (e: any): boolean => e?.row?.data?.status === 'Draft';
  isPendingApproval = (e: any): boolean => e?.row?.data?.status === 'PendingApproval';
  isApproved = (e: any): boolean => e?.row?.data?.status === 'Approved';

  onSubmit(e: any): void {
    const order: RetailSalesOrderDto = e.row.data;
    this.retailSalesOrderService.submit(order.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.SUBMIT_SUCCESS'));
        this.loadOrders();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.SUBMIT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onApprove(e: any): void {
    const order: RetailSalesOrderDto = e.row.data;
    this.retailSalesOrderService.approve(order.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.APPROVE_SUCCESS'));
        this.loadOrders();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const order: RetailSalesOrderDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('RETAIL_SALES_ORDER.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('RETAIL_SALES_ORDER.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.retailSalesOrderService.reject(order.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.REJECT_SUCCESS'));
        this.loadOrders();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onProceedToInvoice(e: any): void {
    const order: RetailSalesOrderDto = e.row.data;
    this.router.navigate(['/sales/direct/invoices/new'], { queryParams: { orderId: order.id } });
  }
}
