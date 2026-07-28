import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Inject } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
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
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InvoiceDropdownGridComponent } from '../../shared/invoice-dropdown-grid/invoice-dropdown-grid.component';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { TreasuryService } from '../../../services/treasury.service';
import { SalesInvoice } from '@/src/models/sales-invoice.model';
import { Receipt, ReceiptSource, CreateReceiptDto } from '@/src/models/receipt.model';
import { PaymentMethod, VoucherStatus, BeneficiaryType } from '@/src/models/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import { NotificationService } from '@/src/services/notification.service';
import { InventoryService } from '../../../services/inventory.service';

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
    MatTableModule,
    MatCheckboxModule,
    InvoiceDropdownGridComponent,
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
  private inventoryService = inject(InventoryService);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  receiptForm!: FormGroup;

  customers = this.customerService.customers$;
  accounts = signal<Account[]>([]);

  customerInvoices = signal<any[]>([]);
  selectedInvoiceId = signal<number | null>(null);
  selectedInvoiceCars = signal<any[]>([]);
  receiptTypes = ['CUSTOMER','GENERAL','ADVANCE','TRANSFER'];
  isEditMode = signal(false);
  editingReceipt = signal<Receipt | null>(null);
  totalAmountReceived = computed(() => this.receiptForm?.get('totalAmountReceived')?.value || 0);
  totalAllocated = computed(() => {
    const allocations = this.allocations.value;
    return allocations.reduce((sum: number, alloc: any) => sum + (alloc.amountToPay || 0), 0);
  });
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

  /** Allocation (the invoice-distribution table) is only required when the user is both on a
   *  CUSTOMER receipt AND hasn't opted into the advance/no-allocation toggle. */
  requiresAllocation = computed(() => this.isCustomerReceipt() && !this.noInvoiceAllocation());

  // Journal preview: builds journal lines based on current form and allocations
  journalPreview = computed(() => {
    const lines: Array<any> = [];
    const debitAccId = this.receiptForm?.get('debitAccountId')?.value;
    const creditAccId = this.receiptForm?.get('creditAccountId')?.value;
    const total = this.totalAmountReceived() || 0;

    // If accounts are not set, still build preview with placeholders so UI shows amounts
    const debitName = debitAccId ? this.getAccountName(debitAccId) : 'Unassigned (Debit)';
    const creditName = creditAccId ? this.getAccountName(creditAccId) : 'Unassigned (Credit)';

    // Debit line - single line for cash/bank (or placeholder)
    // Debit should show the amount on the debit side only (credit = 0)
    lines.push({
      accountId: debitAccId || null,
      accountName: debitName,
      debit: total,
      credit: 0,
      link: null
    });

    // If allocations exist (customer receipts), create credit lines per allocation
    const allocs = this.allocations.value || [];
    if (allocs.length > 0) {
      allocs.forEach((a: any) => {
        const amt = a.amountToPay || 0;
        lines.push({
          accountId: creditAccId || null,
          accountName: creditAccId ? this.getAccountName(creditAccId) : 'Unassigned (Credit)',
          debit: 0,
          credit: amt,
          link: a.invoiceId || null,
          reference: a.reference || null
        });
      });
      // If allocations don't sum to total, add a final credit to cover remainder (suspense)
      const sumAlloc = allocs.reduce((s: number, x: any) => s + (x.amountToPay || 0), 0);
      const rem = +(total - sumAlloc).toFixed(2);
      if (rem > 0.001) {
        lines.push({
          accountId: creditAccId || null,
          accountName: creditName,
          debit: 0,
          credit: rem,
          link: null,
          reference: 'Unallocated'
        });
      }
    } else {
      // No allocations: single credit line
      lines.push({
        accountId: creditAccId || null,
        accountName: creditName,
        debit: 0,
        credit: total,
        link: null
      });
    }

    return lines;
  });

  journalTotals = computed(() => {
    const lines = this.journalPreview();
    const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    return { totalDebit, totalCredit, diff: +(totalDebit - totalCredit).toFixed(2) };
  });

  get allocations(): FormArray {
    return this.receiptForm.get('allocations') as FormArray;
  }

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
        this.selectedInvoiceCars.set([]);
        this.clearAllocations();
      }
    });

    // Toggling "advance / no invoice allocation" on clears any half-entered allocation rows
    // (they'd otherwise sit invisible in the form model and confuse buildReceiptDtos() if the
    // user toggles back off); toggling off re-fetches the customer's invoices so the allocation
    // table repopulates instead of staying empty.
    this.receiptForm.get('noInvoiceAllocation')?.valueChanges.subscribe((checked: boolean) => {
      if (checked) {
        this.clearAllocations();
      } else {
        const customerId = this.receiptForm.get('customerId')?.value;
        if (customerId) this.loadCustomerInvoices(customerId);
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
    // Only apply customer/invoice logic for CUSTOMER receipt type
    this.receiptForm.patchValue({ customerId });
    if (!this.isCustomerReceipt()) {
      this.customerInvoices.set([]);
      this.clearAllocations();
      return;
    }

    if (customerId) {
      this.loadCustomerInvoices(customerId);
    } else {
      this.customerInvoices.set([]);
      this.clearAllocations();
    }
  }

  private loadCustomerInvoices(customerId: number) {
    // Load outstanding invoices for the customer
    this.salesService.getOutstandingInvoicesByCustomerId(customerId).subscribe({
      next: (invoices) => {
        this.customerInvoices.set(invoices);
        this.createAllocationsFromInvoices(invoices);
      },
      error: (error) => {
        console.error('Error loading customer invoices:', error);
        this.customerInvoices.set([]);
        this.clearAllocations();
      }
    });
  }

  loadInvoiceCars(invoiceId: number | null) {
    if (!this.isCustomerReceipt()) { this.selectedInvoiceCars.set([]); this.selectedInvoiceId.set(null); return; }
    this.selectedInvoiceId.set(invoiceId);
    if (!invoiceId) { this.selectedInvoiceCars.set([]); return; }
    this.inventoryService.getCarsByPurchaseInvoice(invoiceId).subscribe({
      next: cars => this.selectedInvoiceCars.set(cars || []),
      error: err => { console.error('Failed loading cars for invoice', err); this.selectedInvoiceCars.set([]); }
    });
  }

  addSelectedInvoiceCarsToAllocations() {
    if (!this.isCustomerReceipt()) return;
    const cars = this.selectedInvoiceCars();
    if (!cars || !cars.length) return;
    // Convert each car to an allocation row (invoice-level association kept)
    while (this.allocations.length) this.allocations.removeAt(0);
    cars.forEach(car => {
      const allocation = this.fb.group({
        invoiceId: [this.selectedInvoiceId() || null],
        reference: [car.chassisNumber || car.vin || ''],
        originalBalance: [car.purchasePrice ?? car.totalCost ?? 0],
        amountToPay: [car.purchasePrice ?? car.totalCost ?? 0, [Validators.min(0)]]
      });
      this.allocations.push(allocation);
    });
  }

  private createAllocationsFromInvoices(invoices: any[]) {
    if (!this.isCustomerReceipt()) return;
    this.clearAllocations();
    invoices.forEach(invoice => {
      const allocation = this.fb.group({
        invoiceId: [invoice.id],
        reference: [invoice.invoiceNumber],
        originalBalance: [invoice.amountDue],
        amountToPay: [0, [Validators.min(0)]],
        selectedInvoice: [invoice.id], // for dropdown selection
        invoiceAccountId: [invoice.debitAccountId || null]
      });
      this.allocations.push(allocation);
    });
  }

  private clearAllocations() {
    while (this.allocations.length > 0) {
      this.allocations.removeAt(0);
    }
  }

  distributeAmount() {
    if (!this.isCustomerReceipt()) return; // only for customer receipts
    const totalAmount = this.totalAmountReceived();
    const numAllocations = this.allocations.length;

    if (numAllocations > 0 && totalAmount > 0) {
      // FIFO distribution - apply to oldest invoices first
      let remainingAmount = totalAmount;
      this.allocations.controls.forEach((allocation, index) => {
        if (remainingAmount > 0) {
          const originalBalance = allocation.get('originalBalance')?.value || 0;
          const amountToApply = Math.min(remainingAmount, originalBalance);
          allocation.patchValue({ amountToPay: amountToApply });
          remainingAmount -= amountToApply;
        } else {
          allocation.patchValue({ amountToPay: 0 });
        }
      });
    }
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
    this.receiptForm.patchValue({
      receiptType: 'CUSTOMER',
      voucherDate: receipt.voucherDate?.toString().split('T')[0],
      totalAmountReceived: receipt.totalAmount,
      creditAccountId: receipt.creditAccountId,
      debitAccountId: receipt.debitAccountId,
      customerId: receipt.customerId,
      notes: receipt.notes
    });

    // A Receipt maps to exactly one invoice (referenceId) - populate a single allocation row
    // rather than the multi-invoice picker used when creating a new receipt.
    this.clearAllocations();
    if (receipt.source === ReceiptSource.Sale && receipt.referenceId) {
      const allocation = this.fb.group({
        invoiceId: [receipt.referenceId],
        reference: [''],
        originalBalance: [receipt.totalAmount],
        amountToPay: [receipt.totalAmount, [Validators.min(0)]],
        selectedInvoice: [receipt.referenceId],
        invoiceAccountId: [receipt.receiptDetails?.[0]?.incomeAccountId ?? null]
      });
      this.allocations.push(allocation);

      if (receipt.customerId) {
        this.loadCustomerInvoices(receipt.customerId);
      }
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
      allocations: this.fb.array([])
    });
    // Add at least one detail
    this.addDetail();
  }

  getInvoiceById(id: number) {
    return this.customerInvoices().find(inv => inv.id === id);
  }


  addDetail() {
    const detail = this.fb.group({
      invoiceId: [null],
      reference: [''],
      originalBalance: [0],
      amountToPay: [0, [Validators.min(0)]]
    });
    this.allocations.push(detail);
  }

  removeDetail(index: number) {
    if (this.allocations.length > 1) {
      this.allocations.removeAt(index);
    }
  }

  /** Builds one CreateReceiptDto per allocation row (an amountToPay > 0 against one invoice) -
   * the backend's Receipt is a single-invoice-per-receipt model (one CustomerId/ReferenceId),
   * so a multi-invoice allocation batch becomes several sequential Receipt creations. */
  private buildReceiptDtos(): CreateReceiptDto[] {
    const formValue = this.receiptForm.value;
    const voucherDate = formValue.voucherDate;
    const customerId = formValue.customerId;
    const creditAccountId = formValue.creditAccountId;
    const debitAccountId = formValue.debitAccountId;
    const notes = formValue.notes;

    const rows = (formValue.allocations || []).filter((a: any) => (a.amountToPay || 0) > 0);

    return rows.map((alloc: any, index: number) => ({
      voucherNumber: `${this.editingReceipt()?.voucherNumber || 'RCPT'}-${index + 1}`,
      voucherDate,
      totalAmount: alloc.amountToPay,
      creditAccountId,
      debitAccountId,
      customerId,
      source: ReceiptSource.Sale,
      referenceId: alloc.invoiceId ?? alloc.selectedInvoice ?? undefined,
      notes,
      receiptDetails: [{
        incomeAccountId: alloc.invoiceAccountId ?? creditAccountId,
        amount: alloc.amountToPay,
        note: alloc.reference || undefined
      }]
    }));
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

    // CUSTOMER receipts that are actually being allocated: amount is split across one or more
    // invoice allocations. A CUSTOMER receipt with noInvoiceAllocation checked (advance payment,
    // business rule scenario 1) skips straight to the single-receipt path below instead, keeping
    // customerId (unlike switching receiptType away from CUSTOMER, which would clear it).
    if (this.requiresAllocation()) {
      if (this.unallocatedBalance() !== 0) {
        this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.UNALLOCATED_BALANCE_ERROR'));
        return;
      }
      if (!this.receiptForm.get('customerId')?.value) {
        this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.SELECT_CUSTOMER'));
        return;
      }

      const dtos = this.buildReceiptDtos();
      if (dtos.length === 0) {
        this.notificationService.showError(this.translate.instant('ACCOUNTS.RECEIPT_FORM.NO_ALLOCATIONS'));
        return;
      }

      if (this.isEditMode()) {
        // A receipt maps to exactly one invoice - editing updates that single Receipt in place.
        this.receiptService.updateReceipt(dtos[0], this.editingReceipt()!.id).subscribe({
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

      // Create mode: post each allocation as its own Receipt, one after another so a duplicate
      // voucher-number collision or partial failure is reported per row rather than silently
      // dropping the rest.
      this.createReceiptsSequentially(dtos, 0);
      return;
    }

    // Advance/no-allocation CUSTOMER receipt, or GENERAL/ADVANCE/TRANSFER: no invoice link, a
    // single receipt for the full amount (customerId carried through when present).
    if (this.isCustomerReceipt() && !this.receiptForm.get('customerId')?.value) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.SELECT_CUSTOMER'));
      return;
    }
    const dto = this.buildSingleReceiptDto();
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

  private buildSingleReceiptDto(): CreateReceiptDto {
    const formValue = this.receiptForm.value;
    return {
      voucherNumber: this.editingReceipt()?.voucherNumber || 'RCPT',
      voucherDate: formValue.voucherDate,
      totalAmount: formValue.totalAmountReceived,
      creditAccountId: formValue.creditAccountId,
      debitAccountId: formValue.debitAccountId,
      customerId: formValue.customerId,
      source: ReceiptSource.Other,
      notes: formValue.notes,
      receiptDetails: [{ incomeAccountId: formValue.creditAccountId, amount: formValue.totalAmountReceived }]
    };
  }

  private createReceiptsSequentially(dtos: CreateReceiptDto[], index: number): void {
    if (index >= dtos.length) {
      this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
      this.router.navigate(['/accounts/receipts']);
      return;
    }
    this.receiptService.addReceipt(dtos[index]).subscribe({
      next: () => this.createReceiptsSequentially(dtos, index + 1),
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