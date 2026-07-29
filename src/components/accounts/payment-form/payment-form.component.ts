import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule, Validators, FormArray, FormBuilder } from '@angular/forms';
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
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import {
  InvoiceAllocationGridComponent,
  InvoiceAllocationRow,
} from '../../shared/invoice-allocation-grid/invoice-allocation-grid.component';
import { AllocatableInvoice } from '../../../models/invoice-allocation.model';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier.model';
import { PurchasesService } from '../../../services/purchases.service';
import { PaymentService } from '../../../services/payment.service';
import { InventoryService } from '../../../services/inventory.service';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { Payment, BeneficiaryType } from '../../../models/payment.model';
import { VoucherStatus } from '../../../models/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { NotificationService } from '@/src/services/notification.service';

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
    MatTableModule,
    DxDataGridModule,
    DxButtonModule,
    InvoiceAllocationGridComponent,
  ],
  templateUrl: './payment-form.component.html',
  styleUrl: './payment-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFormComponent implements OnInit {
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private translate      = inject(TranslateService);
  private supplierService   = inject(SupplierService);
  private purchasesService  = inject(PurchasesService);
  private paymentService    = inject(PaymentService);
  private accountingService = inject(AccountingService);
  private inventoryService  = inject(InventoryService);
  private notificationService = inject(NotificationService);
  private fb = inject(FormBuilder);

  paymentForm!: FormGroup;

  // Debit/Credit selectors must only offer leaf/postable accounts -- parent/grouping accounts
  // are excluded server-side by this endpoint, not filtered client-side from the full account list.
  accounts        = toSignal(this.accountingService.getPostableAccounts(), { initialValue: [] });
  suppliers           = signal<Supplier[]>([]);
  /** Outstanding (unpaid/partially paid) invoices for the selected supplier -- offered to the
   *  allocation grid's "add invoice" dropdown, in AllocatableInvoice shape. */
  outstandingInvoices = signal<AllocatableInvoice[]>([]);
  /** Rows the user has actually added to the allocation grid (single source of truth for what
   *  gets sent as InvoiceAllocations). Independent of `details` (the car-cost breakdown below). */
  allocationRows = signal<InvoiceAllocationRow[]>([]);
  isEditMode          = signal(false);
  editingPayment      = signal<Payment | null>(null);

  totalAmount = computed(() =>
    this.details.value.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
  );

  totalAllocated = computed(() => this.allocationRows().reduce((sum, r) => sum + (r.amount || 0), 0));

  /** Car-cost distribution rows (`Details`) are only a meaningful, required breakdown when the
   *  payment is linked to at least one invoice -- an advance/no-invoice payment has nothing to
   *  distribute across cars, so the sum-must-match-voucher-amount rule stands down. Mirrors the
   *  backend, which treats InvoiceAllocations/Details as independently optional
   *  (PaymentService.CreateAsync only sums Details "if (dto.Details != null && dto.Details.Any())"). */
  hasInvoiceAllocation = computed(() => this.allocationRows().length > 0);

  difference = computed(() => {
    if (!this.hasInvoiceAllocation()) return 0;
    const voucher = this.paymentForm?.get('totalVoucherAmount')?.value || 0;
    return voucher - this.totalAmount();
  });

  // ── Journal Balance panel (Debit/Credit/Difference, mirrors journal-entries.component.ts) ──
  debitAccountName = computed(() => this.getAccountName(this.paymentForm?.get('debitAccountId')?.value ?? null));
  creditAccountName = computed(() => this.getAccountName(this.paymentForm?.get('creditAccountId')?.value ?? null));
  journalTotalDebit = computed(() => this.paymentForm?.get('totalVoucherAmount')?.value || 0);
  journalTotalCredit = computed(() => this.paymentForm?.get('totalVoucherAmount')?.value || 0);
  isJournalBalanced = computed(() => this.journalTotalDebit() === this.journalTotalCredit());

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.initForm();

    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode.set(true);
        this.loadPayment(+id);
      }
    });
  }

  // ── Form Init ────────────────────────────────────────────────────────────────
  private initForm(): void {
    this.paymentForm = this.fb.group({
      voucherDate:        [new Date().toISOString().split('T')[0], Validators.required],
      paymentMethod:      ['BANK_TRANSFER',  Validators.required],
      totalVoucherAmount: [0, [Validators.required, Validators.min(0.01)]],
      debitAccountId:     [null, Validators.required],
      creditAccountId:    [null, Validators.required],
      supplierId:         [null, Validators.required],
      notes:              [''],
      status:             ['DRAFT'],
      createdBy:          [1],
      details:            this.fb.array([])
    });
  }

  // ── Supplier Change ──────────────────────────────────────────────────────────
  /** Selecting a supplier loads only their unpaid/partially-paid invoices for the allocation grid. */
  onSupplierChange(supplierId: number | null): void {
    this.allocationRows.set([]);
    while (this.details.length) this.details.removeAt(0);
    if (!supplierId) {
      this.outstandingInvoices.set([]);
      return;
    }
    this.purchasesService.getOutstandingInvoicesBySupplierId(supplierId).subscribe({
      next: invoices => this.outstandingInvoices.set(invoices.map(inv => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amountDue: inv.amountDue,
      }))),
      error: () => this.outstandingInvoices.set([])
    });
  }

  onAllocationRowsChange(rows: InvoiceAllocationRow[]): void {
    this.allocationRows.set(rows);
  }

  get details(): FormArray {
    return this.paymentForm.get('details') as FormArray;
  }

  // ── Load / Populate ──────────────────────────────────────────────────────────
  private loadPayment(id: number): void {
    this.paymentService.getPaymentById(id).subscribe({
      next:  p  => { this.editingPayment.set(p); this.populateForm(p); },
      error: () => {
        this.notificationService.showError(this.translate.instant('ACCOUNTS.PAYMENTS.FORM.ERROR_LOADING'));
        this.router.navigate(['/accounts/payments']);
      }
    });
  }

  private populateForm(payment: Payment): void {
    this.paymentForm.patchValue({
      voucherDate:        new Date(payment.voucherDate).toISOString().split('T')[0],
      totalVoucherAmount: payment.amount,
      debitAccountId:     payment.debitAccountId  ?? null,
      creditAccountId:    payment.creditAccountId ?? null,
      notes:              payment.notes,
      status:             payment.status,
    });

    while (this.details.length) this.details.removeAt(0);
    payment.details.forEach(d => this.details.push(this.buildDetailGroup(d)));

    const hasAllocations = (payment.invoiceAllocations?.length ?? 0) > 0;
    if (hasAllocations) {
      this.allocationRows.set(payment.invoiceAllocations.map(a => ({
        invoiceId: a.invoiceId,
        invoiceNumber: a.invoiceNumber || `#${a.invoiceId}`,
        originalBalance: a.amount,
        amount: a.amount,
      })));
    } else if (payment.purchaseInvoiceId) {
      // Legacy single-invoice payment -- surface it as a single allocation row so editing one
      // doesn't look any different from a genuinely multi-allocated payment.
      this.allocationRows.set([{
        invoiceId: payment.purchaseInvoiceId,
        invoiceNumber: `#${payment.purchaseInvoiceId}`,
        originalBalance: payment.amount,
        amount: payment.amount,
      }]);
    } else {
      this.allocationRows.set([]);
    }

    if (payment.beneficiaryId) {
      // The invoice(s) being edited may already be fully paid (excluded from the outstanding
      // list) -- load the supplier's outstanding invoices and merge in any allocated invoice not
      // already present, so the grid's dropdown still shows every invoice this payment touches.
      this.paymentForm.patchValue({ supplierId: payment.beneficiaryId }, { emitEvent: false });
      this.purchasesService.getOutstandingInvoicesBySupplierId(payment.beneficiaryId).subscribe(invoices => {
        const options = invoices.map(inv => ({
          invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amountDue: inv.amountDue,
        }));
        const missing = this.allocationRows()
          .filter(r => !options.some(o => o.invoiceId === r.invoiceId))
          .map(r => ({ invoiceId: r.invoiceId, invoiceNumber: r.invoiceNumber, amountDue: r.originalBalance }));
        this.outstandingInvoices.set([...options, ...missing]);
      });
    }
  }

  // ── Detail Helpers (car-cost distribution -- independent of invoice allocation) ─────────────
  /** chassisNumber/model are only meaningful when the row was auto-populated from an
   * invoice's car; a manual (no-invoice) payment row only needs an amount -- and even that
   * amount is optional (not min(0.01)-required) when there's no invoice allocated, since the
   * row then represents an unused, empty distribution rather than a real car-cost line. */
  private buildDetailGroup(car?: any): FormGroup {
    const amountValidators = this.hasInvoiceAllocation()
      ? [Validators.required, Validators.min(0.01)]
      : [Validators.min(0)];
    return this.fb.group({
      chassisNumber: [car?.chassisNumber || ''],
      model:         [car?.model         || ''],
      carId:         [car?.carId         || car?.id || null],
      amount:        [car?.amount        || 0, amountValidators],
      note:          [car?.note          || '']
    });
  }

  addDetail(car?: any): void {
    this.details.push(this.buildDetailGroup(car));
  }

  removeDetail(index: number): void {
    if (this.details.length > 1) this.details.removeAt(index);
  }

  autoDistributeAmount(): void {
    const total = this.paymentForm.get('totalVoucherAmount')?.value || 0;
    if (this.details.length === 0) return;
    const per = total / this.details.length;
    this.details.controls.forEach(c => c.patchValue({ amount: per }));
  }

  /** Loads the cars tied to a specific allocated invoice into the car-cost distribution table --
   *  invoked from the template per allocation row, since a payment may now span several invoices'
   *  cars rather than just one. */
  loadCarsForInvoice(invoiceId: number): void {
    this.inventoryService.getCarsByPurchaseInvoice(invoiceId).subscribe({
      next: cars => cars.forEach(car => this.addDetail({
        carId:         car.id,
        chassisNumber: car.chassisNumber || car.vin,
        model:         `${car.make} ${car.model} ${car.year}`,
        amount:        car.purchasePrice ?? car.totalCost ?? 0,
        note:          ''
      })),
      error: () => {}
    });
  }

  // ── Account Name Helper ──────────────────────────────────────────────────────
  getAccountName(accountId: number | null): string {
    if (!accountId) return '-';
    const acc = (this.accounts() as any[]).find(a => a.id === accountId);
    return acc ? `${acc.accountCode} - ${acc.accountNameAr}` : '-';
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  savePayment(): void {
    if (this.paymentForm.invalid) { this.paymentForm.markAllAsTouched(); return; }
    // Detail-row distribution is only required to match the voucher amount when an invoice is
    // allocated (see hasInvoiceAllocation/difference) -- an advance/no-invoice payment always
    // posts a balanced journal entry (debit == credit == totalVoucherAmount) regardless of Details.
    if (this.hasInvoiceAllocation() && Math.abs(this.difference()) > 0.01) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.DIFFERENCE_ERROR'));
      return;
    }
    if (!this.isJournalBalanced()) {
      this.notificationService.showError(this.translate.instant('ACCOUNTING.UNBALANCED'));
      return;
    }
    // Over-allocation is caught client-side for immediate feedback; the backend
    // (ValidateInvoiceAllocationsAsync) is the actual authority and re-checks this regardless.
    if (this.totalAllocated() > this.paymentForm.get('totalVoucherAmount')?.value + 0.01) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.DIFFERENCE_ERROR'));
      return;
    }

    const v = this.paymentForm.value;
    const allocationRows = this.allocationRows().filter(r => (r.amount || 0) > 0);

    const payment: Partial<Payment> = {
      voucherNumber:    this.editingPayment()?.voucherNumber || '',
      voucherDate:      new Date(v.voucherDate),
      amount:           v.totalVoucherAmount,
      status:           v.status === 'DRAFT' ? VoucherStatus.Draft : VoucherStatus.Approved,
      notes:            v.notes,
      createdBy:        v.createdBy || 1,
      beneficiaryType:  BeneficiaryType.Supplier,
      beneficiaryId:    v.supplierId,
      debitAccountId:   v.debitAccountId,
      creditAccountId:  v.creditAccountId,
      // With no invoice allocated, Details is an optional car-cost breakdown -- an empty/zero
      // leftover row carries no information and would fail the backend's detailsTotal===Amount
      // check (PaymentService.CreateAsync) if a non-zero voucher amount were sent alongside it,
      // so only rows with a real amount are ever submitted in that case.
      details: (this.hasInvoiceAllocation() ? v.details : v.details.filter((d: any) => (d.amount || 0) > 0))
        .map((d: any) => ({
          carId:         d.carId,
          chassisNumber: d.chassisNumber,
          model:         d.model,
          amount:        d.amount,
          note:          d.note || undefined,
        })),
      invoiceAllocations: allocationRows.map(r => ({ invoiceId: r.invoiceId, amount: r.amount })),
    };

    const action$ = this.isEditMode()
      ? this.paymentService.updatePayment(payment, this.editingPayment()!.id!)
      : this.paymentService.addPayment(payment);

    action$.subscribe({
      next:  () => {
        this.notificationService.showSuccess( this.translate.instant(this.isEditMode()
            ? 'TOAST.UPDATED'
            : 'TOAST.ADD_SUCCESS')
        );
        this.router.navigate(['/accounts/payments']);
      },
      error: () => this.notificationService.showError(
        this.translate.instant('TOAST.ERROR_SAVING')
      )
    });
  }

  // ── TrackBy ──────────────────────────────────────────────────────────────────
  trackByInvoiceId(_: number, inv: PurchaseInvoice): number { return inv.id; }
  trackByAccountId(_: number, acc: any): number             { return acc.id; }
}
