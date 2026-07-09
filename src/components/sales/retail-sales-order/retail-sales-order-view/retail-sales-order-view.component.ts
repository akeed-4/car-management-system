import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RetailSalesOrderService } from '../../../../services/retail-sales-order.service';
import { NotificationService } from '../../../../services/notification.service';
import { RetailSalesOrderDto } from '../../../../models/retail-sales-order.model';

@Component({
  selector: 'app-retail-sales-order-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './retail-sales-order-view.component.html',
  styleUrls: ['./retail-sales-order-view.component.css']
})
export class RetailSalesOrderViewComponent implements OnInit {
  order: RetailSalesOrderDto | null = null;
  orderId!: number;

  constructor(
    private retailSalesOrderService: RetailSalesOrderService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = +params['id'];
      this.load();
    });
  }

  load(): void {
    this.retailSalesOrderService.getById(this.orderId).subscribe({
      next: (order) => this.order = order,
      error: (err) => {
        console.error('Error loading sales order', err);
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.LOAD_ERROR'));
      }
    });
  }

  onEdit(): void {
    this.router.navigate(['/sales/direct/orders/edit', this.orderId]);
  }

  onBack(): void {
    this.router.navigate(['/sales/direct/orders']);
  }

  onSubmit(): void {
    this.retailSalesOrderService.submit(this.orderId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.SUBMIT_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.SUBMIT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onApprove(): void {
    this.retailSalesOrderService.approve(this.orderId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.APPROVE_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(): Promise<void> {
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('RETAIL_SALES_ORDER.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('RETAIL_SALES_ORDER.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.retailSalesOrderService.reject(this.orderId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('RETAIL_SALES_ORDER.REJECT_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('RETAIL_SALES_ORDER.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onProceedToInvoice(): void {
    this.router.navigate(['/sales/direct/invoices/new'], { queryParams: { orderId: this.orderId } });
  }
}
