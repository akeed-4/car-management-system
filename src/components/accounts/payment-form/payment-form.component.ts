import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { SupplierService } from '../../../services/supplier.service';
import { PurchasesService } from '../../../services/purchases.service';
import { PaymentService } from '../../../services/payment.service';
import { TreasuryService } from '../../../services/treasury.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';

@Component({
  selector: 'app-payment-form',
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
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent implements OnInit {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private supplierService = inject(SupplierService);
  private purchasesService = inject(PurchasesService);
  private paymentService = inject(PaymentService);
  private treasuryService = inject(TreasuryService);

  paymentForm!: FormGroup;

  suppliers = toSignal(this.supplierService.getSuppliers(), { initialValue: [] });
  accounts = this.treasuryService.accounts$;
  
  outstandingInvoices = signal<PurchaseInvoice[]>([]);
  
  selectedInvoiceDetails = computed(() => {
    const invId = this.paymentForm?.get('invoice')?.value;
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.paymentForm = new FormGroup({
      voucherNumber: new FormControl(`PV-${Date.now()}`),
      date: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      supplier: new FormControl(null, Validators.required),
      invoice: new FormControl(null),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('Bank Transfer', Validators.required),
      accountId: new FormControl(null, Validators.required)
    });
  }

  onSupplierChange(supplierId: number | null) {
    this.paymentForm.patchValue({ invoice: null, amount: 0 });
    if (supplierId) {
      this.purchasesService.getOutstandingInvoicesBySupplierId(supplierId).subscribe(invoices => this.outstandingInvoices.set(invoices));
    } else {
      this.outstandingInvoices.set([]);
    }
  }

  onInvoiceChange(invoiceId: number | null) {
    const invoice = this.outstandingInvoices().find(inv => inv.id === invoiceId);
    this.paymentForm.patchValue({ amount: invoice ? invoice.amountDue : 0 });
  }

  savePayment() {
    if (this.paymentForm.invalid) {
      return;
    }

    const formValue = this.paymentForm.value;
    const supplier = this.suppliers().find(s => s.id === formValue.supplier);
    const invoice = this.selectedInvoiceDetails();
    const account = this.accounts().find(a => a.id === formValue.accountId);

    // Validate base requirements (supplier, account, amount)
    if (!supplier || !account || formValue.amount <= 0) {
      alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.FILL_REQUIRED'));
      return;
    }

    // If invoice is selected, enforce amount bounds and apply payment
    if (invoice) {
      if (formValue.amount > invoice.amountDue) {
        alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.AMOUNT_EXCEEDS'));
        return;
      }
      this.purchasesService.applyPayment(invoice.id, formValue.amount);
    }

    // Create and save the payment voucher (invoice fields are optional)
    this.paymentService.addPayment({
      voucherNumber: formValue.voucherNumber,
      date: formValue.date,
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseInvoiceId: invoice?.id ?? null,
      purchaseInvoiceNumber: invoice?.invoiceNumber ?? null,
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      accountId: account.id,
      accountName: account.name,
    });

    alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.SAVED'));
    this.router.navigate(['/accounts/payments']);
  }

  trackBySupplierId(index: number, supplier: any): number {
    return supplier.id;
  }

  trackByInvoiceId(index: number, invoice: PurchaseInvoice): number {
    return invoice.id;
  }

  trackByAccountId(index: number, account: any): number {
    return account.id;
  }
}