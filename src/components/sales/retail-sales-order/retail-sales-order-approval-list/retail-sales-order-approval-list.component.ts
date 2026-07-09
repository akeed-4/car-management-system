import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RetailSalesOrderService } from '../../../../services/retail-sales-order.service';
import { NotificationService } from '../../../../services/notification.service';
import { RetailSalesOrderDto } from '../../../../models/retail-sales-order.model';

@Component({
  selector: 'app-retail-sales-order-approval-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './retail-sales-order-approval-list.component.html',
  styleUrls: ['./retail-sales-order-approval-list.component.css']
})
export class RetailSalesOrderApprovalListComponent implements OnInit {
  orders: RetailSalesOrderDto[] = [];

  constructor(
    private retailSalesOrderService: RetailSalesOrderService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.retailSalesOrderService.getAll().subscribe({
      next: (orders: any) => {
        const all: RetailSalesOrderDto[] = Array.isArray(orders) ? orders : (orders?.data ?? []);
        this.orders = all.filter(o => o.status === 'PendingApproval');
      },
      error: (err) => {
        console.error('Error loading sales order approvals', err);
      }
    });
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/sales/direct/orders/view', id]);
  }

  getLinesCount(rowData: RetailSalesOrderDto): number {
    return rowData.lines ? rowData.lines.length : 0;
  }

  onApprove(e: any): void {
    const order: RetailSalesOrderDto = e.row.data;
    this.retailSalesOrderService.approve(order.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.APPROVE_SUCCESS'));
        this.loadPendingApprovals();
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
        this.loadPendingApprovals();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}
