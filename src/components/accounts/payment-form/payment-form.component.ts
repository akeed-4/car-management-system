import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { SupplierService } from '../../../services/supplier.service';
import { ProcurementService } from '../../../services/procurement.service';
import { PaymentService } from '../../../services/payment.service';
import { TreasuryService } from '../../../services/treasury.service';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent {
  private router = inject(Router);
  private supplierService = inject(SupplierService);
  private procurementService = inject(ProcurementService);
  private paymentService = inject(PaymentService);
  private treasuryService = inject(TreasuryService);

  suppliers = this.supplierService.suppliers$;
  accounts = this.treasuryService.accounts$;
  
  voucherNumber = signal(`PV-${Date.now()}`);
  date = signal(new Date().toISOString().split('T')[0]);
  selectedSupplierId = signal<number | null>(null);
  selectedInvoiceId = signal<number | null>(null);
  amount = signal(0);
  paymentMethod = signal('Bank Transfer');
  selectedAccountId = signal<number | null>(null);
  
  outstandingInvoices = computed(() => {
    const suppId = this.selectedSupplierId();
    if (!suppId) return [];
    return this.procurementService.getOutstandingInvoicesBySupplierId(suppId);
  });

  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  onSupplierChange(supplierId: number | null) {
    this.selectedSupplierId.set(supplierId);
    this.selectedInvoiceId.set(null); // Reset invoice selection
    this.amount.set(0);
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
      alert('الرجاء تعبئة جميع الحقول بشكل صحيح.');
      return;
    }
    if (paymentAmount > invoice.amountDue) {
      alert('المبلغ المدفوع أكبر من المبلغ المستحق.');
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

    alert('تم حفظ سند الصرف وتحديث الفاتورة بنجاح.');
    this.router.navigate(['/accounts/payments']);
  }
}