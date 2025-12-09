import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SupplierService } from '../../../services/supplier.service';
import { ProcurementService } from '../../../services/procurement.service';
import { PaymentService } from '../../../services/payment.service';
import { TreasuryService } from '../../../services/treasury.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, TranslateModule],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(ProcurementService);
  private paymentService = inject(PaymentService);
  private treasuryService = inject(TreasuryService);

  suppliers = toSignal(this.supplierService.getSuppliers(), { initialValue: [] });
  accounts = this.treasuryService.accounts$;
  
  voucherNumber = signal(`PV-${Date.now()}`);
  date = signal(new Date().toISOString().split('T')[0]);
  selectedSupplierId = signal<number | null>(null);
  selectedInvoiceId = signal<number | null>(null);
  amount = signal(0);
  paymentMethod = signal('Bank Transfer');
  selectedAccountId = signal<number | null>(null);
  
  outstandingInvoices = signal<PurchaseInvoice[]>([]);
  
  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  onSupplierChange(supplierId: number | null) {
    this.selectedSupplierId.set(supplierId);
    this.selectedInvoiceId.set(null); // Reset invoice selection
    this.amount.set(0);
    if (supplierId) {
      this.procurementService.getOutstandingInvoicesBySupplierId(supplierId).subscribe(invoices => this.outstandingInvoices.set(invoices));
    } else {
      this.outstandingInvoices.set([]);
    }
  }

  onInvoiceChange(invoiceId: number | null) {
    this.selectedInvoiceId.set(invoiceId);
    const invoice = this.outstandingInvoices().find(inv => inv.id === invoiceId);
    this.amount.set(invoice ? invoice.amountDue : 0);
  }

  savePayment() {
    const supplier = this.suppliers().find(s => s.id === this.selectedSupplierId());
    const invoice = this.selectedInvoiceDetails();
    const paymentAmount = this.amount();
    const account = this.accounts().find(a => a.id === this.selectedAccountId());

    if (!supplier || !invoice || !account || paymentAmount <= 0) {
      alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.FILL_REQUIRED'));
      return;
    }
    if (paymentAmount > invoice.amountDue) {
      alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.AMOUNT_EXCEEDS'));
      return;
    }

    // 1. Apply payment to the purchase invoice
    this.procurementService.applyPayment(invoice.id, paymentAmount);

    // 2. Create and save the payment voucher
    this.paymentService.addPayment({
      voucherNumber: this.voucherNumber(),
      date: this.date(),
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseInvoiceId: invoice.id,
      purchaseInvoiceNumber: invoice.invoiceNumber,
      amount: paymentAmount,
      paymentMethod: this.paymentMethod(),
      accountId: account.id,
      accountName: account.name,
    });

    alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.SAVED'));
    this.router.navigate(['/accounts/payments']);
  }
}