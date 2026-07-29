import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  InvoiceAllocationGridComponent,
  InvoiceAllocationRow,
} from '../../shared/invoice-allocation-grid/invoice-allocation-grid.component';
import { AllocatableInvoice } from '../../../models/invoice-allocation.model';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { Receipt, ReceiptSource, CreateReceiptDto } from '@/src/models/receipt.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import { NotificationService } from '@/src/services/notification.service';

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
    MatCheckboxModule,
    InvoiceAllocationGridComponent,
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
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  receiptForm!: FormGroup;

  customers = this.customerService.customers$;
  accounts = signal<Account[]>([]);

  /** Every outstanding sales invoice for the selected customer -- offered to the allocation
   *  grid's "add invoice" dropdown, in AllocatableInvoice shape. */
  customerInvoices = signal<AllocatableInvoice[]>([]);
  /** Rows the user has actually added to the allocation grid (a subset of customerInvoices, each
   *  with an amount assigned). Single source of truth for what gets sent as InvoiceAllocations. */
  allocationRows = signal<InvoiceAllocationRow[]>([]);

  receiptTypes = ['CUSTOMER', 'GENERAL', 'ADVANCE', 'TRANSFER'];
  isEditMode = signal(false);
  editingReceipt = signal<Receipt | null>(null);
  totalAmountReceived = computed(() => this.receiptForm?.get('totalAmountReceived')?.value || 0);
  totalAllocated = computed(() => this.allocationRows().reduce((sum, r) => sum + (r.amount || 0), 0));
  unallocatedBalance = computed(() => this.totalAmountReceived() - this.totalAllocated());

  // ── Journal Balance panel (Debit/Credit/Difference, mirrors journal-entries.component.ts) ──
  debitAccountName = computed(() => this.getAccountName(this.receiptForm?.get('debitAccountId')?.value ?? null));
  creditAccountName = computed(() => this.getAccountName(this.receiptForm?.get('creditAccountId')?.value ?? null));
  journalTotalDebit = computed(() => this.totalAmountReceived());
  journalTotalCredit = computed(() => this.totalAmountReceived());
  isJournalBalanced = computed(() => this.journalTotalDebit() === this.journalTotalCredit());

  isCustomerReceipt = computed(() => {
    return (this.receiptForm?.get('receiptType')?.value || 'CUSTOMER') === 'CUSTOMER';
  });

  /** "Advance payment" toggle: a CUSTOMER receipt with no invoice allocation at all (business
   *  rule scenario 1 -- customer pays an advance, no invoice selected). Unlike switching
   *  receiptType away from CUSTOMER, this keeps customerId and still posts Debit Cash/Bank
   *  Credit Customer Account. Only meaningful while isCustomerReceipt() is true. */
  noInvoiceAllocation = computed(() => this.receiptForm?.get('noInvoiceAllocation')?.value ?? false);

  /** The allocation grid is only shown/required when the user is both on a CUSTOMER receipt AND
   *  hasn't opted into the advance/no-allocation toggle. An allocation left short of the total is
   *  always valid (an unallocated remainder is a standalone/advance portion), so "requires
   *  allocation" only gates whether the grid appears -- not whether it must be fully allocated. */
  requiresAllocation = computed(() => this.isCustomerReceipt() && !this.noInvoiceAllocation());

  ngOnInit() {
    this.initForm();
    // Debit/Credit selectors must only offer leaf/postable accounts -- parent/grouping accounts
    // are excluded server-side by this endpoint, not filtered client-side from the full account list.
    this.accountingService.getPostableAccounts().subscribe(accounts => this.accounts.set(accounts));

    // react to receiptType changes: clear customer/invoices/allocations when not CUSTOMER
    this.receiptForm.get('receiptType')?.valueChanges.subscribe((val: string) => {
      if (val !== 'CUSTOMER') {
        this.receiptForm.patchValue({ customerId: null, noInvoiceAllocation: false });
        this.customerInvoices.set([]);
        this.allocationRows.set([]);
      }
    });

    // Toggling "advance / no invoice allocation" on clears any in-progress allocation rows (they'd
    // otherwise sit unused in the grid and confuse buildReceiptDto() if the user toggles back off).
    this.receiptForm.get('noInvoiceAllocation')?.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        this.allocationRows.set([]);
      }
    });

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

  onCustomerChange(customerId: number | null) {
    this.receiptForm.patchValue({ customerId });
    this.allocationRows.set([]);
    if (!this.isCustomerReceipt() || !customerId) {
      this.customerInvoices.set([]);
      return;
    }
    this.loadCustomerInvoices(customerId);
  }

  private loadCustomerInvoices(customerId: number) {
    this.salesService.getOutstandingInvoicesByCustomerId(customerId).subscribe({
      next: (invoices) => {
        this.customerInvoices.set(invoices.map(inv => ({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          amountDue: inv.amountDue,
        })));
      },
      error: (error) => {
        console.error('Error loading customer invoices:', error);
        this.customerInvoices.set([]);
      }
    });
  }

  onAllocationRowsChange(rows: InvoiceAllocationRow[]): void {
    this.allocationRows.set(rows);
  }

  private loadReceipt(id: number) {
    this.receiptService.getReceiptById(id).subscribe({
      next: (receipt) => {
        this.editingReceipt.set(receipt);
        this.populateForm(receipt);
      },
      error: (error) => {
        console.error('Error loading receipt:', error);
        this.notificationService.showError(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_LOADING'));
        this.router.navigate(['/accounts/receipts']);
      }
    });
  }

  private populateForm(receipt: Receipt) {
    const hasAllocations = (receipt.invoiceAllocations?.length ?? 0) > 0;
    this.receiptForm.patchValue({
      receiptType: 'CUSTOMER',
      voucherDate: receipt.voucherDate?.toString().split('T')[0],
      totalAmountReceived: receipt.totalAmount,
      creditAccountId: receipt.creditAccountId,
      debitAccountId: receipt.debitAccountId,
      customerId: receipt.customerId,
      notes: receipt.notes,
      // Legacy single-invoice receipts (Source=Sale, ReferenceId set, no InvoiceAllocations rows)
      // are surfaced as a single allocation row too, so editing one doesn't look any different
      // from a genuinely multi-allocated receipt.
      noInvoiceAllocation: !hasAllocations && !(receipt.source === ReceiptSource.Sale && receipt.referenceId),
    });

    if (receipt.customerId) {
      this.loadCustomerInvoices(receipt.customerId);
    }

    if (hasAllocations) {
      this.allocationRows.set(receipt.invoiceAllocations.map(a => ({
        invoiceId: a.invoiceId,
        invoiceNumber: a.invoiceNumber || `#${a.invoiceId}`,
        originalBalance: a.amount,
        amount: a.amount,
      })));
    } else if (receipt.source === ReceiptSource.Sale && receipt.referenceId) {
      this.allocationRows.set([{
        invoiceId: receipt.referenceId,
        invoiceNumber: `#${receipt.referenceId}`,
        originalBalance: receipt.totalAmount,
        amount: receipt.totalAmount,
      }]);
    } else {
      this.allocationRows.set([]);
    }
  }

  // ── Account Name Helper ──────────────────────────────────────────────────────
  getAccountName(accountId: number | null): string {
    if (!accountId) return '-';
    const acc = (this.accounts() as any[]).find(a => a.id === accountId);
    return acc ? `${acc.accountCode} - ${acc.accountNameAr}` : '-';
  }

  private initForm() {
    this.receiptForm = this.fb.group({
      receiptType: ['CUSTOMER', Validators.required],
      voucherDate: [new Date().toISOString().split('T')[0], Validators.required],
      totalAmountReceived: [0, [Validators.required, Validators.min(0.01)]],
      receiptMethod: ['CASH', Validators.required],
      creditAccountId: [null, Validators.required],
      debitAccountId: [null, Validators.required],
      customerId: [null],
      // Advance-payment toggle -- see noInvoiceAllocation/requiresAllocation.
      noInvoiceAllocation: [false],
      notes: [''],
      status: ['DRAFT'],
      createdBy: [1],
    });
  }

  /** Single CreateReceiptDto carrying every allocation row as an InvoiceAllocations entry --
   *  replaces the old one-Receipt-per-invoice split (createReceiptsSequentially), which existed
   *  only because the backend used to support one invoice per receipt. Now that
   *  ReceiptInvoiceAllocation supports many invoices per receipt, one voucher/one journal entry
   *  covers the whole allocation set atomically. */
  private buildReceiptDto(): CreateReceiptDto {
    const formValue = this.receiptForm.value;
    const rows = this.allocationRows().filter(r => (r.amount || 0) > 0);

    return {
      voucherNumber: this.editingReceipt()?.voucherNumber || 'RCPT',
      voucherDate: formValue.voucherDate,
      totalAmount: formValue.totalAmountReceived,
      creditAccountId: formValue.creditAccountId,
      debitAccountId: formValue.debitAccountId,
      customerId: formValue.customerId,
      source: rows.length > 0 ? ReceiptSource.Sale : ReceiptSource.Other,
      notes: formValue.notes,
      // ReceiptDetails is the account/car cost breakdown, unconditionally required to sum to
      // totalAmount server-side (ReceiptService.CreateAsync) -- unrelated to invoice allocation,
      // so a single generic row covering the full amount is always supplied.
      receiptDetails: [{ incomeAccountId: formValue.creditAccountId, amount: formValue.totalAmountReceived }],
      invoiceAllocations: rows.map(r => ({ invoiceId: r.invoiceId, amount: r.amount })),
    };
  }

  saveReceipt() {
    if (this.receiptForm.invalid) {
      this.receiptForm.markAllAsTouched();
      return;
    }
    if (!this.isJournalBalanced()) {
      this.notificationService.showError(this.translate.instant('ACCOUNTING.UNBALANCED'));
      return;
    }
    if (this.isCustomerReceipt() && !this.receiptForm.get('customerId')?.value) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.SELECT_CUSTOMER'));
      return;
    }
    // Over-allocation is caught client-side for immediate feedback; the backend
    // (ValidateInvoiceAllocationsAsync) is the actual authority and re-checks this regardless.
    if (this.requiresAllocation() && this.totalAllocated() > this.totalAmountReceived() + 0.01) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.UNALLOCATED_BALANCE_ERROR'));
      return;
    }

    const dto = this.buildReceiptDto();
    if (this.isEditMode()) {
      this.receiptService.updateReceipt(dto, this.editingReceipt()!.id).subscribe({
        next: () => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.UPDATED'));
          this.router.navigate(['/accounts/receipts']);
        },
        error: (error) => {
          console.error('Error updating receipt:', error);
          this.notificationService.showError(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_UPDATING'));
        }
      });
      return;
    }

    this.receiptService.addReceipt(dto).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
        this.router.navigate(['/accounts/receipts']);
      },
      error: (error) => {
        console.error('Error saving receipt:', error);
        this.notificationService.showError(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_SAVING'));
      }
    });
  }

  trackByCustomerId(index: number, customer: any): number {
    return customer.id;
  }

  trackByAccountId(index: number, account: any): number {
    return account.id;
  }
}
