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
import { InvoiceDropdownGridComponent } from '../../shared/invoice-dropdown-grid/invoice-dropdown-grid.component';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { ReceiptService } from '../../../services/receipt.service';
import { TreasuryService } from '../../../services/treasury.service';
import { SalesInvoice } from '@/src/models/sales-invoice.model';
import { ReceiptVoucher } from '@/src/models/receipt-voucher.model';
import { PaymentMethod, VoucherStatus, BeneficiaryType } from '@/src/models/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { Account } from '../../accounting/models';
import { ToastService } from '@/src/services/toast.service';
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
  private fb = inject(FormBuilder);

  receiptForm!: FormGroup;

  customers = this.customerService.customers$;
  accounts = signal<Account[]>([]);

  customerInvoices = signal<any[]>([]);
  selectedInvoiceId = signal<number | null>(null);
  selectedInvoiceCars = signal<any[]>([]);
  receiptTypes = ['CUSTOMER','GENERAL','ADVANCE','TRANSFER'];
  isEditMode = signal(false);
  editingReceipt = signal<ReceiptVoucher | null>(null);
  totalAmountReceived = computed(() => this.receiptForm?.get('totalAmountReceived')?.value || 0);
  totalAllocated = computed(() => {
    const allocations = this.allocations.value;
    return allocations.reduce((sum: number, alloc: any) => sum + (alloc.amountToPay || 0), 0);
  });
  unallocatedBalance = computed(() => this.totalAmountReceived() - this.totalAllocated());

  isCustomerReceipt = computed(() => {
    return (this.receiptForm?.get('receiptType')?.value || 'CUSTOMER') === 'CUSTOMER';
  });

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
    this.accountingService.accounts$.subscribe(accounts => this.accounts.set(accounts));

    // react to receiptType changes: clear customer/invoices/allocations when not CUSTOMER
    this.receiptForm.get('receiptType')?.valueChanges.subscribe((val: string) => {
      if (val !== 'CUSTOMER') {
        this.receiptForm.patchValue({ customerId: null });
        this.customerInvoices.set([]);
        this.selectedInvoiceCars.set([]);
        this.clearAllocations();
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
        alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_LOADING') || 'Error loading receipt');
        this.router.navigate(['/accounts/receipts']);
      }
    });
  }


  private populateForm(receipt: ReceiptVoucher) {
    // This would need to be updated based on the actual ReceiptVoucher structure
    this.receiptForm.patchValue({
      receiptType: (receipt as any).receiptType || 'CUSTOMER',
      voucherNumber: receipt.voucherNumber,
      voucherDate: receipt.voucherDate?.toISOString().split('T')[0],
      totalAmountReceived: receipt.amount,
      receiptMethod: receipt.paymentMethod,
      creditAccountId: receipt.creditAccountId,
      debitAccountId: receipt.debitAccountId,
      customerId: receipt.customerId,
      notes: receipt.notes
    });

    // Populate allocations if they exist in the receipt
    // This depends on the actual ReceiptVoucher model structure
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
      voucherNumber: [`RV-${Date.now()}`],
      voucherDate: [new Date().toISOString().split('T')[0], Validators.required],
      totalAmountReceived: [0, [Validators.required, Validators.min(0.01)]],
      receiptMethod: ['CASH', Validators.required],
      creditAccountId: [null, Validators.required],
      debitAccountId: [null, Validators.required],
      customerId: [null],
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

  saveReceipt() {
    if (this.receiptForm.invalid) {
      return;
    }
    // Only enforce allocation balance for CUSTOMER receipts
    if (this.isCustomerReceipt() && this.unallocatedBalance() !== 0) {
      alert('Total allocated amount must equal the total amount received');
      return;
    }

    const formValue = this.receiptForm.value;

    const receiptData = {
      ...formValue,
      allocations: formValue.allocations.map((alloc: any) => ({
        invoiceId: alloc.invoiceId,
        amountToPay: alloc.amountToPay
      }))
    };

    if (this.isEditMode()) {
      this.receiptService.updateReceipt(receiptData, this.editingReceipt()!.id).subscribe({
        next: () => {
          this.router.navigate(['/accounts/receipts']);
        },
        error: (error) => {
          console.error('Error updating receipt:', error);
          alert(this.translate.instant('ACCOUNTS.RECEIPT_FORM.ERROR_UPDATING') || 'Error updating receipt');
        }
      });
    } else {
      this.receiptService.addReceipt(receiptData).subscribe({
        next: (response) => {
          this.router.navigate(['/accounts/receipts']);
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

  trackByAccountId(index: number, account: any): number {
    return account.id;
  }
}