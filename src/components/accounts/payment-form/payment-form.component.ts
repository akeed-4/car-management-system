import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
import { InvoiceDropdownGridComponent } from '../../shared/invoice-dropdown-grid/invoice-dropdown-grid.component';
import { SupplierService } from '../../../services/supplier.service';
import { PurchasesService } from '../../../services/purchases.service';
import { PaymentService } from '../../../services/payment.service';
import { TreasuryService } from '../../../services/treasury.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { PaymentVoucher, PaymentMethod, VoucherStatus, BeneficiaryType } from '@/src/types/payment-voucher.model';

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
    InvoiceDropdownGridComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);
  private supplierService = inject(SupplierService);
  private purchasesService = inject(PurchasesService);
  private paymentService = inject(PaymentService);
  private treasuryService = inject(TreasuryService);

  paymentForm!: FormGroup;

  suppliers = toSignal(this.supplierService.getSuppliers(), { initialValue: [] });
  accounts = this.treasuryService.accounts$;
  
  outstandingInvoices = signal<PurchaseInvoice[]>([]);
  
  isEditMode = signal(false);
  editingPayment = signal<PaymentVoucher | null>(null);
  
  selectedInvoiceDetails = computed(() => {
    const invId = this.paymentForm?.get('invoice')?.value;
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });

  onInvoiceSelected(invoice: any) {
    this.paymentForm.patchValue({ 
      invoice: invoice.id,
      amount: invoice.amountDue 
    });
  }

  ngOnInit() {
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.loadPayment(+id);
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  private loadPayment(id: number) {
    this.paymentService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.editingPayment.set(payment);
        this.populateForm(payment);
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_LOADING') || 'Error loading payment');
        this.router.navigate(['/accounts/payments']);
      }
    });
  }

  private populateForm(payment: PaymentVoucher) {
    const paymentMethodStr = payment.paymentMethod === PaymentMethod.Bank ? 'BANK_TRANSFER' : 'CASH';
    const statusStr = payment.status === VoucherStatus.Draft ? 'DRAFT' : payment.status === VoucherStatus.Approved ? 'APPROVED' : 'CANCELLED';
    
    this.paymentForm.patchValue({
      voucherNumber: payment.voucherNumber,
      voucherDate: payment.voucherDate.toISOString().split('T')[0],
      supplier: payment.beneficiaryId, // assuming beneficiaryType is Supplier
      invoice: payment.referenceId,
      amount: payment.amount,
      paymentMethod: paymentMethodStr,
      accountId: payment.accountId,
      referenceId: payment.referenceId,
      notes: payment.notes,
      status: statusStr,
      createdBy: payment.createdBy
    });
    if (payment.beneficiaryId) {
      this.onSupplierChange(payment.beneficiaryId);
    }
  }

  private initForm() {
    this.paymentForm = new FormGroup({
      voucherNumber: new FormControl(`PV-${Date.now()}`),
      voucherDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      supplier: new FormControl(null, Validators.required),
      invoice: new FormControl(null),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('BANK_TRANSFER', Validators.required),
      accountId: new FormControl(null, Validators.required),
      referenceId: new FormControl(null),
      notes: new FormControl(''),
      status: new FormControl('DRAFT'),
      createdBy: new FormControl(1)
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

    // Create and save the payment voucher using unified Voucher model
    const paymentMethodEnum = formValue.paymentMethod === 'BANK_TRANSFER' ? PaymentMethod.Bank : PaymentMethod.Cash;
    const statusEnum = formValue.status === 'DRAFT' ? VoucherStatus.Draft : formValue.status === 'APPROVED' ? VoucherStatus.Approved : VoucherStatus.Cancelled;
    
    const voucher: Partial<PaymentVoucher> = {
      voucherNumber: formValue.voucherNumber,
      voucherDate: new Date(formValue.voucherDate),
      amount: formValue.amount,
      paymentMethod: paymentMethodEnum,
      accountId: account.id,
      status: statusEnum,
      notes: formValue.notes || `Payment to ${supplier.name}${invoice ? ` for invoice ${invoice.invoiceNumber}` : ''}`,
      createdBy: formValue.createdBy || 1,
      createdAt: new Date(),
      beneficiaryType: BeneficiaryType.Supplier,
      beneficiaryId: supplier.id,
      referenceId: invoice?.id ?? undefined,
      date: new Date(formValue.voucherDate), // legacy
      paymentNumber: formValue.voucherNumber, // legacy
      purchaseInvoiceId: invoice?.id,
      supplierName: supplier.name,
      description: formValue.notes || `Payment to ${supplier.name}${invoice ? ` for invoice ${invoice.invoiceNumber}` : ''}`
    };
    
    if (this.isEditMode()) {
      this.paymentService.updatePayment(voucher, this.editingPayment()!.id).subscribe({
        next: (updatedPayment) => {
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.UPDATED'));
          this.router.navigate(['/accounts/payments']);
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_UPDATING') || 'Error updating payment');
        }
      });
    } else {
      this.paymentService.addPayment(voucher).subscribe({
        next: (savedPayment) => {
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.SAVED'));
          this.router.navigate(['/accounts/payments']);
        },
        error: (error) => {
          console.error('Error saving payment:', error);
          alert(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_SAVING') || 'Error saving payment');
        }
      });
    }
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