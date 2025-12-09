import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { TreasuryService } from '../../../services/treasury.service';
import { SalesInvoice } from '@/src/types/sales-invoice.model';

@Component({
  selector: 'app-receipt-form',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, TranslateModule],
  templateUrl: './receipt-form.component.html',
  styleUrl: './receipt-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptFormComponent {
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private receiptService = inject(ReceiptService);
  private treasuryService = inject(TreasuryService);
  private translate = inject(TranslateService);

  customers = this.customerService.customers$;
  accounts = this.treasuryService.accounts$;
  
  voucherNumber = signal(`RV-${Date.now()}`);
  date = signal(new Date().toISOString().split('T')[0]);
  selectedCustomerId = signal<number | null>(null);
  selectedInvoiceId = signal<number | null>(null);
  amount = signal(0);
  paymentMethod = signal('Cash');
  selectedAccountId = signal<number | null>(null);
  
  outstandingInvoices = signal<SalesInvoice[]>([]);

  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  onCustomerChange(customerId: number | null) {
    this.selectedCustomerId.set(customerId);
    this.selectedInvoiceId.set(null);
    this.amount.set(0);
    if (customerId) {
      this.salesService.getOutstandingInvoicesByCustomerId(customerId).subscribe(invoices => this.outstandingInvoices.set(invoices));
    } else {
      this.outstandingInvoices.set([]);
    }
  }



  onInvoiceChange(invoiceId: number | null) {
    this.selectedInvoiceId.set(invoiceId);
    const invoice = this.outstandingInvoices().find(inv => inv.id === invoiceId);
    this.amount.set(invoice ? invoice.amountDue : 0);
  }

  saveReceipt() {
    const customer = this.customers().find(c => c.id === this.selectedCustomerId());
    const invoice = this.selectedInvoiceDetails();
    const paymentAmount = this.amount();
    const account = this.accounts().find(a => a.id === this.selectedAccountId());

    if (!customer || !invoice || !account || paymentAmount <= 0) {
      alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.FILL_REQUIRED'));
      return;
    }
    if (paymentAmount > invoice.amountDue) {
      alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.AMOUNT_EXCEEDS'));
      return;
    }

    // 1. Apply payment to the sales invoice
    this.salesService.applyPayment(invoice.id, paymentAmount);

    // 2. Create and save the receipt voucher
    this.receiptService.addReceipt({
      voucherNumber: this.voucherNumber(),
      date: this.date(),
      customerId: customer.id,
      customerName: customer.name,
      salesInvoiceId: invoice.id,
      salesInvoiceNumber: invoice.invoiceNumber,
      amount: paymentAmount,
      paymentMethod: this.paymentMethod(),
      accountId: account.id,
      accountName: account.name,
    });

    alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.SAVED'));
    this.router.navigate(['/accounts/receipts']);
  }
}