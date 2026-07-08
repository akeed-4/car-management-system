import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { QuotationSelectorComponent } from './quotation-selector/quotation-selector.component';
import { PaymentGatewayFormComponent } from './payment-gateway-form/payment-gateway-form.component';
import { RetailService } from '../../../../services/retail.service';
import { ToastService } from '../../../../services/toast.service';
import { RetailQuotation } from '../../../../models/retail/retail-quotation.model';
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
    QuotationSelectorComponent,
    PaymentGatewayFormComponent
  ],
  templateUrl: './retail-invoice-manager.component.html',
  styleUrls: ['./retail-invoice-manager.component.css']
})
export class RetailInvoiceManagerComponent implements OnInit {
  activeQuotation: RetailQuotation | null = null;
  loadingQuotation = false;
  discount = 0;
  payment: RetailPaymentDetails | null = null;
  submitting = false;

  constructor(
    private retailService: RetailService,
    private toast: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const preselectedId = Number(this.route.snapshot.queryParamMap.get('quotationId'));
    if (preselectedId) {
      this.onQuotationIdSelected(preselectedId);
    }
  }

  onQuotationIdSelected(quotationId: number): void {
    this.loadingQuotation = true;
    this.activeQuotation = null;
    this.retailService.getQuotationById(quotationId).subscribe({
      next: quotation => {
        this.activeQuotation = quotation;
        this.loadingQuotation = false;
      },
      error: () => {
        this.loadingQuotation = false;
        this.toast.showError('RETAIL.QUOTATION_LOAD_FAILED');
      }
    });
  }

  onPaymentChange(payment: RetailPaymentDetails | null): void {
    this.payment = payment;
  }

  get subTotal(): number {
    return this.activeQuotation?.totalAmount ?? 0;
  }

  get tax(): number {
    return Math.max(this.subTotal - this.discount, 0) * TAX_RATE;
  }

  get totalAmount(): number {
    return Math.max(this.subTotal - this.discount, 0) + this.tax;
  }

  get isFormValid(): boolean {
    return !!this.activeQuotation && !!this.payment;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.activeQuotation?.id || !this.payment) {
      return;
    }

    this.submitting = true;
    this.retailService
      .createInvoice({
        invoiceDate: new Date().toISOString().split('T')[0],
        quotationId: this.activeQuotation.id,
        discount: this.discount,
        tax: this.tax,
        payment: this.payment
      })
      .subscribe({
        next: invoice => {
          this.submitting = false;
          this.toast.showSuccess('RETAIL.INVOICE_CREATED');
          this.router.navigate(['/sales/retail/deliveries/new'], {
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
