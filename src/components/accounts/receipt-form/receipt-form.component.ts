import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Inject } from '@angular/core';
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
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { TreasuryService } from '../../../services/treasury.service';
import { SalesInvoice } from '@/src/types/sales-invoice.model';
import { ReceiptVoucher } from '@/src/types/receipt-voucher.model';
import { PaymentMethod, VoucherStatus, BeneficiaryType } from '@/src/types/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import { ToastService } from '@/src/services/toast.service';

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
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private receiptService = inject(ReceiptService);
  private accountingService = inject(AccountingService);
  private translate = inject(TranslateService);

  receiptForm!: FormGroup;

  customers = this.customerService.customers$;
  accounts = signal<Account[]>([]);
  
  outstandingInvoices = signal<SalesInvoice[]>([]);

  isEditMode = signal(false);
  editingReceipt = signal<ReceiptVoucher | null>(null);
  
  selectedInvoiceId = signal<number | null>(null);
  
  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId);
  });
  toastService = inject(ToastService);

  onInvoiceSelected(invoice: any) {
    this.receiptForm.patchValue({ 
      invoice: invoice.id,
      amount: invoice.amountDue 
    });
  }

  ngOnInit() {
    this.initForm();
    this.accountingService.accounts$.subscribe(accounts => this.accounts.set(accounts));
    console.log('Receipt Form Init - checking for edit mode'+this.accounts());
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.loadReceipt(+id);
      } else {
        this.isEditMode.set(false);
      }
    });
  }

  private loadReceipt(id: number) {
    this.receiptService.getReceiptById(id).subscribe({
      next: (receipt) => {
        this.editingReceipt.set(receipt);
        this.populateForm(receipt);
      },
      error: (error) => {
        console.error('Error loading receipt:', error);
        alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_LOADING') || 'Error loading receipt');
        this.router.navigate(['/accounts/receipts']);
      }
    });
  }

  private populateForm(receipt: ReceiptVoucher) {
   const paymentMethodStr =
    receipt.paymentMethod === PaymentMethod.Bank
      ? 'BANK_TRANSFER'
      : receipt.paymentMethod === PaymentMethod.Card
      ? 'CARD'
      : 'CASH';

  const statusStr =
    receipt.status === VoucherStatus.Draft
      ? 'DRAFT'
      : receipt.status === VoucherStatus.Approved
      ? 'APPROVED'
      : 'CANCELLED';
    this.receiptForm.patchValue({
      voucherNumber: receipt.voucherNumber,
      voucherDate: receipt.voucherDate,
      customer: receipt.beneficiaryId,
      invoice: receipt.referenceId,
      amount: receipt.amount,
      paymentMethod: paymentMethodStr,
      accountId: receipt.accountId,
      referenceId: receipt.referenceId,
      notes: receipt.notes,
      status: statusStr,
      createdBy: receipt.createdBy,
      customerId: receipt.customerId,
    });
    if (receipt.referenceId) {
      this.selectedInvoiceId.set(receipt.referenceId);
    }
    if (receipt.beneficiaryId) {
      this.onCustomerChange(receipt.beneficiaryId);
    }
  }

  private initForm() {
    this.receiptForm = new FormGroup({
      voucherNumber: new FormControl(`RV-${Date.now()}`),
      voucherDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      customerId: new FormControl(null, Validators.required),
      invoice: new FormControl(null),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('CASH', Validators.required),
      accountId: new FormControl(null, Validators.required),
      referenceId: new FormControl(null),
      notes: new FormControl(''),
      status: new FormControl('DRAFT'),
      createdBy: new FormControl(1)
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
    this.selectedInvoiceId.set(invoiceId);
    const invoice = this.outstandingInvoices().find(inv => inv.id === invoiceId);
    this.receiptForm.patchValue({ amount: invoice ? invoice.amountDue : 0 });
  }

  saveReceipt() {
    if (this.receiptForm.invalid) {
      return;
    }

    const formValue = this.receiptForm.value;
    const customer = this.customers().find(c => c.id === formValue.customerId);
    const invoice = this.selectedInvoiceDetails();
    const account = this.accounts().find(a => a.id === formValue.accountId);
    if (!customer || !account || formValue.amount <= 0) {
      alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.FILL_REQUIRED'));
      return;
    }
    // if (formValue.amount > invoice.amountDue) {
    //   alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.AMOUNT_EXCEEDS'));
    //   return;
    // }

    // 1. Apply payment to the sales invoice
    // this.salesService.applyPayment(invoice.id, formValue.amount);

    // 2. Create and save the receipt voucher using unified Voucher model
    const paymentMethodEnum = formValue.paymentMethod === 'Bank Transfer' ? PaymentMethod.Bank : PaymentMethod.Cash;
    const statusEnum = formValue.status === 'DRAFT' ? VoucherStatus.Draft : formValue.status === 'APPROVED' ? VoucherStatus.Approved : VoucherStatus.Cancelled;
    
    const voucher: Partial<ReceiptVoucher> = {
      voucherNumber: formValue.voucherNumber,
      voucherDate: new Date(formValue.voucherDate),
      amount: formValue.amount,
      paymentMethod: paymentMethodEnum,
      accountId: account.id,
      status: statusEnum,
      notes: formValue.notes || `Receipt from ${customer.name}${invoice ? ` for invoice ${invoice.invoiceNumber}` : ''}`,
      createdBy: formValue.createdBy || 1,
      createdAt: new Date(),
      beneficiaryType: BeneficiaryType.Customer,
      beneficiaryId: customer.id,
      referenceId: invoice?.id ?? undefined,
      date: new Date(formValue.voucherDate), // legacy
      paymentNumber: formValue.voucherNumber, // legacy
      salesInvoiceId: invoice?.id,
      customerName: customer.name,
      customerId: formValue.customerId,
      description: formValue.notes || `Receipt from ${customer.name}${invoice ? ` for invoice ${invoice.invoiceNumber}` : ''}`
    };
    
    if (this.isEditMode()) {
      this.receiptService.updateReceipt(voucher, this.editingReceipt()!.id).subscribe({
        next: (updatedReceipt) => {
          alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.UPDATED'));
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.RECEIPT_FORM.UPDATED') || 'Receipt updated successfully');
        },
        error: (error) => {
          console.error('Error updating receipt:', error);
          alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_UPDATING') || 'Error updating receipt');
        }
      });
    } else {
      console.log(voucher)
      this.receiptService.addReceipt(voucher).subscribe({
        next: (savedReceipt) => {
          alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.SAVED'));
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.RECEIPT_FORM.SAVED') || 'Receipt saved successfully');
        },
        error: (error) => {
          console.error('Error saving receipt:', error);
          alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_SAVING') || 'Error saving receipt');
        }
      });
    }
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