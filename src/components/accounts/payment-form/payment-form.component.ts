import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { InvoiceDropdownGridComponent } from '../../shared/invoice-dropdown-grid/invoice-dropdown-grid.component';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier.model';
import { PurchasesService } from '../../../services/purchases.service';
import { PaymentService } from '../../../services/payment.service';
import { InventoryService } from '../../../services/inventory.service';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { Payment, PaymentDetail, BeneficiaryType } from '../../../models/payment.model';
import { PaymentMethod, VoucherStatus } from '../../../models/payment-voucher.model';
import { AccountingService } from '../../accounting/accounting.service';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
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
    InvoiceDropdownGridComponent,
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
  /** Outstanding (unpaid/partially paid) invoices for the selected supplier only - Requirement 6. */
  outstandingInvoices = signal<PurchaseInvoice[]>([]);
  selectedInvoiceId   = signal<number | null>(null);
  isEditMode          = signal(false);
  editingPayment      = signal<Payment | null>(null);

  selectedInvoiceDetails = computed(() => {
    const invId = this.selectedInvoiceId();
    if (!invId) return null;
    return this.outstandingInvoices().find(inv => inv.id === invId) ?? null;
  });

  totalAmount = computed(() =>
    this.details.value.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
  );

  difference = computed(() => {
    const voucher = this.paymentForm?.get('totalVoucherAmount')?.value || 0;
    return voucher - this.totalAmount();
  });

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
      debitAccountId:     [null, Validators.required],   // ← NEW
      creditAccountId:    [null, Validators.required],   // ← NEW
      supplierId:         [null, Validators.required],
      purchaseInvoiceId:  [null],
      notes:              [''],
      status:             ['DRAFT'],
      createdBy:          [1],
      details:            this.fb.array([])
    });

    this.addDetail();
  }

  // ── Supplier Change ──────────────────────────────────────────────────────────
  /** Requirement 6: selecting a supplier loads only their unpaid/partially-paid invoices. */
  onSupplierChange(supplierId: number | null): void {
    this.paymentForm.patchValue({ purchaseInvoiceId: null });
    this.onInvoiceChange(null);
    if (!supplierId) {
      this.outstandingInvoices.set([]);
      return;
    }
    this.purchasesService.getOutstandingInvoicesBySupplierId(supplierId).subscribe({
      next: invoices => this.outstandingInvoices.set(invoices),
      error: () => this.outstandingInvoices.set([])
    });
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
      purchaseInvoiceId:  payment.purchaseInvoiceId ?? null,
      notes:              payment.notes,
      status:             payment.status,
    });

    while (this.details.length) this.details.removeAt(0);
    payment.details.forEach(d => this.details.push(this.buildDetailGroup(d)));

    if (payment.purchaseInvoiceId) {
      this.selectedInvoiceId.set(payment.purchaseInvoiceId);
      // The invoice being edited may already be fully paid (excluded from the outstanding list) -
      // load it directly and set the supplier so the dropdown still shows it.
      this.purchasesService.getInvoiceById(payment.purchaseInvoiceId).subscribe(invoice => {
        this.paymentForm.patchValue({ supplierId: invoice.supplierId }, { emitEvent: false });
        this.purchasesService.getOutstandingInvoicesBySupplierId(invoice.supplierId).subscribe(invoices => {
          const merged = invoices.some(i => i.id === invoice.id) ? invoices : [...invoices, invoice];
          this.outstandingInvoices.set(merged);
        });
      });
    }
  }

  // ── Detail Helpers ───────────────────────────────────────────────────────────
  private buildDetailGroup(car?: any): FormGroup {
    return this.fb.group({
      chassisNumber: [car?.chassisNumber || '', Validators.required],
      model:         [car?.model         || '', Validators.required],
      carId:         [car?.carId         || car?.id || null],
      amount:        [car?.amount        || 0, [Validators.required, Validators.min(0.01)]],
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
    const per   = total / this.details.length;
    this.details.controls.forEach(c => c.patchValue({ amount: per }));
  }

  // ── Invoice Change ───────────────────────────────────────────────────────────
  onInvoiceChange(invoiceId: number | null): void {
    this.paymentForm.patchValue({ purchaseInvoiceId: invoiceId });
    this.selectedInvoiceId.set(invoiceId);
    if (!invoiceId) {
      while (this.details.length) this.details.removeAt(0);
      this.addDetail();
      return;
    }
    this.inventoryService.getCarsByPurchaseInvoice(invoiceId).subscribe({
      next: cars => {
        while (this.details.length) this.details.removeAt(0);
        if (cars.length) {
          cars.forEach(car => this.addDetail({
            carId:         car.id,
            chassisNumber: car.chassisNumber || car.vin,
            model:         `${car.make} ${car.model} ${car.year}`,
            amount:        car.purchasePrice ?? car.totalCost ?? 0,
            note:          ''
          }));
        } else {
          this.addDetail();
        }
      },
      error: () => { while (this.details.length) this.details.removeAt(0); this.addDetail(); }
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
    if (Math.abs(this.difference()) > 0.01) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.DIFFERENCE_ERROR'));
      return;
    }

    const v = this.paymentForm.value;
    if (!v.purchaseInvoiceId) {
      this.notificationService.showError(this.translate.instant('ACCOUNTS.FORM.SELECT_INVOICE'));
      return;
    }

    const payment: Partial<Payment> = {
      voucherNumber:    this.editingPayment()?.voucherNumber || '',
      voucherDate:      new Date(v.voucherDate),
      amount:           v.totalVoucherAmount,
      status:           v.status === 'DRAFT' ? VoucherStatus.Draft : VoucherStatus.Approved,
      notes:            v.notes,
      createdBy:        v.createdBy || 1,
      beneficiaryType:  BeneficiaryType.Supplier,
      beneficiaryId:    v.supplierId,
      purchaseInvoiceId:v.purchaseInvoiceId,
      debitAccountId:   v.debitAccountId,    // ← NEW
      creditAccountId:  v.creditAccountId,   // ← NEW
      details: v.details.map((d: any) => ({
        carId:         d.carId,
        chassisNumber: d.chassisNumber,
        model:         d.model,
        amount:        d.amount,
        note:          d.note || undefined,
      }))
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