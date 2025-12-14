import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { TreasuryService } from '../../../services/treasury.service';
import { SalesInvoice } from '@/src/types/sales-invoice.model';

@Component({
  selector: 'app-receipt-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './receipt-form.component.html',
  styleUrl: './receipt-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptFormComponent implements OnInit {
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private receiptService = inject(ReceiptService);
  private treasuryService = inject(TreasuryService);
  private translate = inject(TranslateService);

  receiptForm!: FormGroup;

  customers = this.customerService.customers$;
  accounts = this.treasuryService.accounts$;
  
  outstandingInvoices = signal<SalesInvoice[]>([]);

  selectedInvoiceDetails = computed(() => {
    const invId = this.receiptForm?.get('invoice')?.value;
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.receiptForm = new FormGroup({
      voucherNumber: new FormControl(`RV-${Date.now()}`),
      date: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      customer: new FormControl(null, Validators.required),
      invoice: new FormControl(null),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('Cash', Validators.required),
      accountId: new FormControl(null, Validators.required)
    });
  }

  onCustomerChange(customerId: number | null) {
    this.receiptForm.patchValue({ invoice: null, amount: 0 });
    if (customerId) {
      this.salesService.getOutstandingInvoicesByCustomerId(customerId).subscribe(invoices => this.outstandingInvoices.set(invoices));
    } else {
      this.outstandingInvoices.set([]);
    }
  }



  onInvoiceChange(invoiceId: number | null) {
    const invoice = this.outstandingInvoices().find(inv => inv.id === invoiceId);
    this.receiptForm.patchValue({ amount: invoice ? invoice.amountDue : 0 });
  }

  saveReceipt() {
    if (this.receiptForm.invalid) {
      return;
    }

    const formValue = this.receiptForm.value;
    const customer = this.customers().find(c => c.id === formValue.customer);
    const invoice = this.selectedInvoiceDetails();
    const account = this.accounts().find(a => a.id === formValue.accountId);

    if (!customer || !invoice || !account || formValue.amount <= 0) {
      alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.FILL_REQUIRED'));
      return;
    }
    if (formValue.amount > invoice.amountDue) {
      alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.AMOUNT_EXCEEDS'));
      return;
    }

    // 1. Apply payment to the sales invoice
    this.salesService.applyPayment(invoice.id, formValue.amount);

    // 2. Create and save the receipt voucher
    this.receiptService.addReceipt({
      voucherNumber: formValue.voucherNumber,
      date: formValue.date,
      customerId: customer.id,
      customerName: customer.name,
      salesInvoiceId: invoice.id,
      salesInvoiceNumber: invoice.invoiceNumber,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      accountId: account.id,
      accountName: account.name,
    });

    alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.SAVED'));
    this.router.navigate(['/accounts/receipts']);
  }

  trackByCustomerId(index: number, customer: any): number {
    return customer.id;
  }

  trackByInvoiceId(index: number, invoice: SalesInvoice): number {
    return invoice.id;
  }

  trackByAccountId(index: number, account: any): number {
    return account.id;
  }
}