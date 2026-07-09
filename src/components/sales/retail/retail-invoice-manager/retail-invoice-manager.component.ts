import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentGatewayFormComponent } from './payment-gateway-form/payment-gateway-form.component';
import { RetailService } from '../../../../services/retail.service';
import { RetailSalesOrderService } from '../../../../services/retail-sales-order.service';
import { ToastService } from '../../../../services/toast.service';
import { RetailSalesOrderDto } from '../../../../models/retail-sales-order.model';
import { RetailPaymentDetails } from '../../../../models/retail/retail-invoice.model';

const TAX_RATE = 0.15;

@Component({
  selector: 'app-retail-invoice-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    PaymentGatewayFormComponent
  ],
  templateUrl: './retail-invoice-manager.component.html',
  styleUrls: ['./retail-invoice-manager.component.css']
})
export class RetailInvoiceManagerComponent implements OnInit {
  activeOrder: RetailSalesOrderDto | null = null;
  loadingOrder = false;
  discount = 0;
  payment: RetailPaymentDetails | null = null;
  submitting = false;

  constructor(
    private retailService: RetailService,
    private retailSalesOrderService: RetailSalesOrderService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.queryParamMap.get('orderId'));
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  loadOrder(orderId: number): void {
    this.loadingOrder = true;
    this.activeOrder = null;
    this.retailSalesOrderService.getById(orderId).subscribe({
      next: order => {
        this.activeOrder = order;
        this.loadingOrder = false;
      },
      error: () => {
        this.loadingOrder = false;
        this.toast.showError('RETAIL.QUOTATION_LOAD_FAILED');
      }
    });
  }

  onPaymentChange(payment: RetailPaymentDetails | null): void {
    this.payment = payment;
  }

  get subTotal(): number {
    return this.activeOrder?.totalAmount ?? 0;
  }

  get tax(): number {
    return Math.max(this.subTotal - this.discount, 0) * TAX_RATE;
  }

  get totalAmount(): number {
    return Math.max(this.subTotal - this.discount, 0) + this.tax;
  }

  get isFormValid(): boolean {
    return !!this.activeOrder && this.activeOrder.status === 'Approved' && !!this.payment;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.activeOrder || !this.payment) {
      return;
    }

    this.submitting = true;
    this.retailService
      .createInvoice({
        retailSalesOrderId: this.activeOrder.id,
        retailQuotationId: this.activeOrder.retailQuotationId,
        paymentMethod: this.payment.method,
        transactionHash: this.payment.hash ?? this.payment.reference ?? '',
        debitAccountId: 0,
        creditAccountId: 0,
        userId: 1
      })
      .subscribe({
        next: invoice => {
          this.submitting = false;
          this.toast.showSuccess('RETAIL.INVOICE_CREATED');
          this.router.navigate(['/sales/direct/deliveries/new'], {
            queryParams: { invoiceId: invoice.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('RETAIL.INVOICE_CREATE_FAILED');
        }
      });
  }
}
