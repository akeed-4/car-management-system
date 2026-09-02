import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PurchaseAdditionalCostService } from '../../../services/purchase-additional-cost.service';
import { PurchasesService } from '../../../services/purchases.service';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { openCreateAccountDialog } from '../../accounting/create-account-dialog.helper';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/AuthService.service';
import { Account } from '../../accounting/models';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { AccountAutocompleteComponent } from '../../shared/account-autocomplete/account-autocomplete.component';
import {
  AllocationMethod,
  ExpenseCategory,
  ManualAllocationLine,
  PurchaseAdditionalCostLine,
} from '../../../models/purchase-additional-cost.model';

@Component({
  selector: 'app-purchase-additional-cost-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule,
    AccountAutocompleteComponent,
  ],
  templateUrl: './purchase-additional-cost-form.component.html',
  styleUrl: './purchase-additional-cost-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseAdditionalCostFormComponent implements OnInit, OnChanges {
  private service = inject(PurchaseAdditionalCostService);
  private purchasesService = inject(PurchasesService);
  private accountingService = inject(AccountingService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  /** Set when embedded in a Purchase Invoice's "Additional Costs" tab: locks the invoice field
   * to this invoice and hides the invoice picker. */
  @Input() purchaseInvoiceId: number | null = null;
  /** Set to edit an existing cost record; null/undefined creates a new one. */
  @Input() costId: number | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);
  locked = signal(false); // true once the loaded document is Posted/Cancelled

  invoices = signal<PurchaseInvoice[]>([]);
  debitAccounts = signal<Account[]>([]);
  payableAccounts = signal<Account[]>([]);

  previewLines = signal<PurchaseAdditionalCostLine[]>([]);
  previewTotal = signal(0);
  previewError = signal<string | null>(null);
  previewLoading = signal(false);

  expenseCategories: ExpenseCategory[] = ['Insurance', 'Customs', 'Shipping', 'Freight', 'Handling', 'Registration', 'Other'];
  allocationMethods: AllocationMethod[] = ['Equal', 'Quantity', 'Cost', 'Weight', 'Manual'];

  costForm = new FormGroup({
    purchaseInvoiceId: new FormControl<number | null>(null, Validators.required),
    costDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
    expenseCategory: new FormControl<ExpenseCategory>('Other', Validators.required),
    description: new FormControl(''),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    allocationMethod: new FormControl<AllocationMethod>('Cost', Validators.required),
    // True (default): capitalize into the allocated cars' inventory value -- existing behavior,
    // unchanged. False: post as a period expense -- no inventory-value effect.
    isCapitalized: new FormControl<boolean>(true, { nonNullable: true }),
    // Optional: when left blank, the backend derives the debit account from the target invoice's
    // Store accounting configuration (Additional Cost / Purchase Expense / Freight / Customs,
    // depending on isCapitalized + expenseCategory) -- see AccountResolutionService. An explicit
    // choice here is still honored and validated as before.
    debitAccountId: new FormControl<number | null>(null),
    creditAccountId: new FormControl<number | null>(null, Validators.required),
  });

  /** Manual mode only: editable per-line amounts, keyed by invoiceItemId. */
  manualAmounts = signal<Record<number, number>>({});

  isManualMethod = computed(() => this.costForm.get('allocationMethod')?.value === 'Manual');

  manualTotal = computed(() => Object.values(this.manualAmounts()).reduce((sum, v) => sum + (v || 0), 0));

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  // Debit leg: capitalized-vs-expensed/category-dependent account, recalculated whenever the
  // invoice/isCapitalized/expenseCategory changes. Credit leg: the invoice's supplier AP account.
  // The backend still independently re-derives Debit when left null (ResolveAdditionalCostAccountAsync)
  // -- this tracker only makes that same default visible and overridable in the field itself,
  // rather than a silent server-side fallback the user never sees.
  private debitAccountTracker!: DefaultAccountTracker;
  private creditAccountTracker!: DefaultAccountTracker;
  debitAccountManuallyChanged = computed(() => this.debitAccountManuallyChangedSignal());
  creditAccountManuallyChanged = computed(() => this.creditAccountManuallyChangedSignal());
  private debitAccountManuallyChangedSignal = signal(false);
  private creditAccountManuallyChangedSignal = signal(false);

  // --- Requirement 9: "+ Create Account" from this document -----------------------------------
  openCreateDebitAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.debitAccounts.update(list => [...list, created]);
      this.costForm.get('debitAccountId')?.setValue(created.id);
    });
  }

  openCreateCreditAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.payableAccounts.update(list => [...list, created]);
      this.costForm.get('creditAccountId')?.setValue(created.id);
    });
  }

  /** "Reset to Default" action next to an overridden account field. */
  resetDebitAccountToDefault(): void {
    this.debitAccountTracker.reset();
    this.debitAccountManuallyChangedSignal.set(false);
  }

  resetCreditAccountToDefault(): void {
    this.creditAccountTracker.reset();
    this.creditAccountManuallyChangedSignal.set(false);
  }

  ngOnInit(): void {
    this.purchasesService.getInvoices().subscribe({
      next: (list) => {
        this.invoices.set(list ?? []);
        // Invoices load asynchronously -- once available, recalc for a purchaseInvoiceId that was
        // already set (embedded-in-invoice-tab case) before this list arrived.
        this.recalculateAccountDefaults();
      },
      error: () => this.invoices.set([]),
    });
    this.accountingService.getPostableAccounts('debit').subscribe((accounts) => this.debitAccounts.set(accounts));
    this.accountingService.getPostableAccounts().subscribe((accounts) => this.payableAccounts.set(accounts));

    this.debitAccountTracker = new DefaultAccountTracker(this.accountingService, this.costForm.get('debitAccountId') as any);
    this.creditAccountTracker = new DefaultAccountTracker(this.accountingService, this.costForm.get('creditAccountId') as any);
    this.costForm.get('debitAccountId')?.valueChanges.subscribe(() =>
      this.debitAccountManuallyChangedSignal.set(this.debitAccountTracker.manuallyChanged));
    this.costForm.get('creditAccountId')?.valueChanges.subscribe(() =>
      this.creditAccountManuallyChangedSignal.set(this.creditAccountTracker.manuallyChanged));

    // Set up exactly once (not per loadCost() call) so switching this same instance between
    // new/edit/new again (embedded in a Purchase Invoice tab) never stacks subscriptions;
    // refreshPreview() itself no-ops while locked() so this is safe for a loaded Posted/Cancelled
    // record too.
    this.setupLivePreview();
    this.setupAccountDefaults();
    this.loadCost(this.costId);
  }

  /** Recalculates both account defaults from the current invoice/isCapitalized/expenseCategory --
   * the three inputs ResolveAdditionalCostAccountAsync/ResolvePayableAccountAsync actually depend
   * on. Wired to fire on every relevant field change; also called once invoices() finishes loading
   * (see ngOnInit) since a purchaseInvoiceId may already be set before that list arrives. */
  private setupAccountDefaults(): void {
    this.costForm.get('purchaseInvoiceId')?.valueChanges.subscribe(() => this.recalculateAccountDefaults());
    this.costForm.get('isCapitalized')?.valueChanges.subscribe(() => this.recalculateAccountDefaults());
    this.costForm.get('expenseCategory')?.valueChanges.subscribe(() => this.recalculateAccountDefaults());
  }

  private recalculateAccountDefaults(): void {
    const invoiceId = this.costForm.get('purchaseInvoiceId')?.value;
    if (!invoiceId) return;
    const invoice = this.invoices().find(i => i.id === invoiceId);
    if (!invoice) return;

    if (invoice.storeId) {
      this.debitAccountTracker.recalculate({
        kind: DefaultAccountKind.AdditionalCostDebit,
        storeId: invoice.storeId,
        isCapitalized: !!this.costForm.get('isCapitalized')?.value,
        expenseCategory: this.costForm.get('expenseCategory')?.value ?? undefined,
      });
    }
    this.creditAccountTracker.recalculate({ kind: DefaultAccountKind.AdditionalCostCredit, partyId: invoice.supplierId });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['costId'] && !changes['costId'].firstChange) {
      this.loadCost(this.costId);
    }
  }

  /** Loads an existing cost for editing, or resets to a blank draft (pre-filled with
   * purchaseInvoiceId when embedded) when id is null. Callable more than once on the same
   * instance since the embedded form is reused across New/Edit clicks in the tab. */
  private loadCost(id: number | null): void {
    this.costForm.enable();
    this.locked.set(false);
    this.previewError.set(null);
    this.previewLines.set([]);
    this.previewTotal.set(0);
    this.manualAmounts.set({});

    if (id) {
      this.currentId.set(id);
      this.editMode.set(true);
      this.service.getById(id).subscribe({
        next: (response) => {
          if (!response.success) {
            this.cancelled.emit();
            return;
          }
          const cost = response.data;
          this.costForm.patchValue({
            purchaseInvoiceId: cost.purchaseInvoiceId,
            costDate: cost.costDate,
            expenseCategory: cost.expenseCategory,
            description: cost.description,
            amount: cost.amount,
            allocationMethod: cost.allocationMethod,
            isCapitalized: cost.isCapitalized,
            debitAccountId: cost.debitAccountId,
            creditAccountId: cost.creditAccountId,
          });
          this.previewLines.set(cost.lines);
          this.previewTotal.set(cost.lines.reduce((s, l) => s + l.allocatedAmount, 0));
          const manual: Record<number, number> = {};
          cost.lines.forEach(l => manual[l.invoiceItemId] = l.allocatedAmount);
          this.manualAmounts.set(manual);

          if (cost.status !== 'Draft') {
            this.locked.set(true);
            this.costForm.disable();
          }
        },
        error: () => this.cancelled.emit(),
      });
    } else {
      this.currentId.set(null);
      this.editMode.set(false);
      this.costForm.reset({
        purchaseInvoiceId: this.purchaseInvoiceId,
        costDate: new Date().toISOString().split('T')[0],
        expenseCategory: 'Other',
        description: '',
        amount: null,
        allocationMethod: 'Cost',
        isCapitalized: true,
        debitAccountId: null,
        creditAccountId: null,
      });
    }
  }

  /** Recomputes the allocation preview whenever invoice/method/amount changes (Quantity/Cost/Weight only). */
  private setupLivePreview(): void {
    this.costForm.valueChanges.pipe(debounceTime(300), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))).subscribe(() => {
      this.refreshPreview();
    });
  }

  refreshPreview(): void {
    if (this.locked()) return;

    const invoiceId = this.costForm.get('purchaseInvoiceId')?.value;
    const method = this.costForm.get('allocationMethod')?.value;
    const amount = this.costForm.get('amount')?.value;

    if (!invoiceId || !method || !amount || amount <= 0) {
      this.previewLines.set([]);
      this.previewTotal.set(0);
      return;
    }

    if (method === 'Manual') {
      // Manual mode: build the line list from the invoice items directly (no server round-trip
      // needed to show rows -- amounts are typed in by the clerk), server-validated on save.
      this.purchasesService.getInvoiceById(invoiceId).subscribe({
        next: (invoice) => {
          const lines: PurchaseAdditionalCostLine[] = (invoice.items || []).map(item => ({
            id: 0,
            invoiceItemId: item.id!,
            carId: item.carId,
            carDescription: item.carDescription || '',
            allocationBasis: 0,
            allocatedAmount: this.manualAmounts()[item.id!] ?? 0,
          }));
          this.previewLines.set(lines);
        },
      });
      return;
    }

    this.previewLoading.set(true);
    this.previewError.set(null);
    this.service.previewAllocation(invoiceId, method, amount).subscribe({
      next: (response) => {
        this.previewLoading.set(false);
        if (response.success) {
          this.previewLines.set(response.data.lines);
          this.previewTotal.set(response.data.totalAllocated);
        } else {
          this.previewError.set(response.message);
          this.previewLines.set([]);
        }
      },
      error: (err) => {
        this.previewLoading.set(false);
        this.previewError.set(err?.error?.message ?? err?.message ?? 'Error');
        this.previewLines.set([]);
      },
    });
  }

  onManualAmountChange(invoiceItemId: number, value: string): void {
    const amounts = { ...this.manualAmounts() };
    amounts[invoiceItemId] = Number(value) || 0;
    this.manualAmounts.set(amounts);
    this.previewLines.update(lines => lines.map(l => l.invoiceItemId === invoiceItemId ? { ...l, allocatedAmount: amounts[invoiceItemId] } : l));
  }

  private buildManualLines(): ManualAllocationLine[] {
    return this.previewLines().map(l => ({ invoiceItemId: l.invoiceItemId, allocatedAmount: this.manualAmounts()[l.invoiceItemId] ?? 0 }));
  }

  save(): void {
    if (this.costForm.invalid || this.saving() || this.locked()) {
      this.costForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const v = this.costForm.value;
    const currentUserId = this.authService.currentUser()?.id ?? 0;
    const manualLines = v.allocationMethod === 'Manual' ? this.buildManualLines() : undefined;

    if (this.editMode() && this.currentId()) {
      this.service.update(this.currentId()!, {
        costDate: v.costDate!,
        expenseCategory: v.expenseCategory!,
        description: v.description || undefined,
        amount: v.amount!,
        allocationMethod: v.allocationMethod!,
        isCapitalized: v.isCapitalized,
        debitAccountId: v.debitAccountId ?? undefined,
        creditAccountId: v.creditAccountId!,
        manualLines,
      }).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.notificationService.showSuccess('PURCHASE_ADDITIONAL_COST.SAVED');
            this.saved.emit();
          } else {
            this.notificationService.showError(response.message);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.notificationService.showError(err?.error?.message ?? err?.message ?? 'Error');
        },
      });
    } else {
      this.service.create({
        purchaseInvoiceId: v.purchaseInvoiceId!,
        costDate: v.costDate!,
        expenseCategory: v.expenseCategory!,
        description: v.description || undefined,
        amount: v.amount!,
        allocationMethod: v.allocationMethod!,
        isCapitalized: v.isCapitalized ?? true,
        debitAccountId: v.debitAccountId ?? undefined,
        creditAccountId: v.creditAccountId!,
        createdBy: currentUserId,
        manualLines,
      }).subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.notificationService.showSuccess('PURCHASE_ADDITIONAL_COST.SAVED');
            this.saved.emit();
          } else {
            this.notificationService.showError(response.message);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.notificationService.showError(err?.error?.message ?? err?.message ?? 'Error');
        },
      });
    }
  }
}
