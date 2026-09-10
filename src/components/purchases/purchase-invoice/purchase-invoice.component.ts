
import { ChangeDetectionStrategy, Component, computed, inject, signal, Input, OnInit, OnChanges, SimpleChanges, LOCALE_ID } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { InventoryService } from '../../../services/inventory.service';
import { SupplierService } from '../../../services/supplier.service';
import { PurchasesService } from '../../../services/purchases.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { SalesService } from '../../../services/sales.service';
import { ChartOfAccountsService } from '../../../services/chart-of-accounts.service';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { PaymentMethodService } from '../../../services/payment-method.service';
import { PaymentMethod, deriveLegacyPaymentStrings, matchLegacyPaymentMethodId, isDeferredSettlementType } from '../../../models/payment-method.model';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { VinService } from '../../../services/vin.service';
import { PurchaseInvoice, AuctionCharge } from '../../../models/purchase-invoice.model';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { Car } from '../../../models/car.model';
import { Supplier } from '../../../models/supplier.model';
import { Account } from '../../accounting/models';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { InvoiceClassificationOption } from '../../../models/invoice-classification.model';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InvoiceItemDialogComponent } from '../../sales/invoice-item-dialog/invoice-item-dialog.component';
import { openCreateAccountDialog } from '../../accounting/create-account-dialog.helper';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectChange } from '@angular/material/select';
import { ToastService } from '@/src/services/toast.service';
import { LanguageService } from '@/src/services/language.service';
import { Direction } from '@angular/cdk/bidi';
import { CarSelectionDialogComponent, PurchaseCarSelectionCard } from './car-selection-dialog/car-selection-dialog.component';
import { buildVehicleDescription } from '../../../models/vehicle-description';
import { applyFieldLock } from '../../../models/form-field-lock';
import { VinManagementDialogComponent, VinEntry } from '../vin-management-dialog/vin-management-dialog.component';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { CarReceipt } from '../../../models/car-receipt.model';
import { extractErrorMessage } from '../../../models/http-error-message';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { warnIfPartyAccountMissing } from '../../shared/party-account-required-dialog/party-account-required-warning.helper';
import { StoreContextService } from '../../../services/store-context.service';
import { resolveStoreDisplayName } from '../../../models/store-display.util';

const VAT_RATE = 0.15; // 15% VAT

export enum InvoiceType {
  Taxable = 'Taxable',
  ZeroRated = 'Zero Rated',
  Exempt = 'Exempt'
}

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NotificationService } from '../../../services/notification.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CarsReceiptNoteService } from '@/src/services/cars-receipt-note.service';
import { CarsReceiptNoteDto } from '@/src/models/cars-receipt-note.model';
import { CashAmountCalculatorComponent } from '../../shared/cash-amount-calculator/cash-amount-calculator.component';
import { PurchaseAdditionalCostListComponent } from '../purchase-additional-cost-list/purchase-additional-cost-list.component';
import { PurchaseAdditionalCostFormComponent } from '../purchase-additional-cost-form/purchase-additional-cost-form.component';
import { PurchaseAdditionalCostService } from '@/src/services/purchase-additional-cost.service';
import { Observable, of, map, tap, catchError, finalize, switchMap } from 'rxjs';
import { formatCurrency } from '@angular/common';
import { DocumentTotalsComponent, DocumentPrintService, DocumentTotalsRow } from '../../shared/document';
import { AppActionBarComponent } from '../../shared/app-action-bar/app-action-bar.component';
import { AccountAutocompleteComponent } from '../../shared/account-autocomplete/account-autocomplete.component';
import { ResponsiveService } from '../../../services/responsive.service';
import { SharedMobileDataEntryComponent } from '../../shared/shared-mobile-data-entry/shared-mobile-data-entry.component';
import { SharedMobileListComponent } from '../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListFieldDto, MobileListActionDto } from '../../shared/shared-mobile-list/shared-mobile-list.model';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CashAmountCalculatorComponent,
    FormsModule,
    CommonModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatGridListModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatCardModule,
    MatDatepickerModule,
    MatTabsModule,
    MatDialogModule,
    MatTooltipModule,
    DxDataGridModule,
    NgxMatSelectSearchModule,
    PurchaseAdditionalCostListComponent,
    PurchaseAdditionalCostFormComponent,
    DocumentTotalsComponent,
    AccountAutocompleteComponent,
    SharedMobileDataEntryComponent,
    AppActionBarComponent,
    SharedMobileListComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceComponent implements OnInit {
  /**
   * Input property to lock the payment method
   * When true, payment method cannot be changed by user
   */
  @Input() lockPaymentMethod: boolean = false;

  /**
   * Input property to set the fixed payment method
   * Used when lockPaymentMethod is true
   * Values: 'cash', 'credit', or any payment method value
   */
  @Input() fixedPaymentMethod: any;

  /**
   * Input property to set a custom title for the invoice
   * If not provided, uses default title
   */
  @Input() customTitle:any;

  // Expose enum to template
  InvoiceType = InvoiceType;

  inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(PurchasesService);
  private accountingService = inject(AccountingService);
  private paymentMethodService = inject(PaymentMethodService);
  private currentSettingService = inject(CurrentSettingService);
  private salesService = inject(SalesService);
  private languageService = inject(LanguageService);
  private carsReceiptNoteService = inject(CarsReceiptNoteService);
  private vinService = inject(VinService);
  private purchaseCycleService = inject(PurchaseCycleService);
  private purchaseAdditionalCostService = inject(PurchaseAdditionalCostService);
  private router = inject(Router);
  protected translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private toastService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private storeContext = inject(StoreContextService);
  private notificationService = inject(NotificationService);
  private oidcSecurityService = inject(OidcSecurityService);
  /** Shared save-before-print workflow + formatting locale for the shared totals block. */
  private printWorkflow = inject(DocumentPrintService);
  private localeId = inject(LOCALE_ID);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;
  
  private currentUserId = signal<number | null>(null);

  cardLayout2 = this.currentSettingService.getCardLayout(2);
  cardLayout3 = this.currentSettingService.getCardLayout(3);
  cardLayout4 = this.currentSettingService.getCardLayout(4);
  cardLayout5 = this.currentSettingService.getCardLayout(5);
  cardLayout6 = this.currentSettingService.getCardLayout(6);

  // Services state
  suppliers = signal<Supplier[]>([]);
  /** Read-only label for the (no-longer-user-editable) Store field -- resolves the form's storeId
   *  against every store the caller is authorized for, so an edit-mode document keeps showing its
   *  real, originally-saved store name even if that store isn't the caller's current one. */
  currentStoreName = computed(() => resolveStoreDisplayName(
    this.storeContext.memberships(),
    this.purchaseInvoiceForm?.get('storeId')?.value ?? null,
    this.storeContext.current()?.nameAr,
  ));
  cars = this.inventoryService.cars$;
  carStocks = signal<StoreCarStockDto[]>([]);
  textDir: Direction = this.languageService.getCurrentLanguage() == 'en' ? 'ltr' : 'rtl';

  /**
   * Debit (Inventory/Expense) account override -- this document's only user-selectable account
   * (the Credit leg, Supplier AP or Cash/Bank, is this document's system-resolved side and is
   * never shown as a field). Default-preselected via AccountResolutionService.resolve-default
   * (same "default account + manual override" pattern as paymentAccountId below); the user can
   * still pick a different postable account. Backend re-validates and falls back to its existing
   * derivation when left null -- see PurchaseInvoiceService.ResolveDebitAccountAsync.
   */
  debitAccounts = signal<Account[]>([]);
  private debitAccountsLoaded = false;

  private debitAccountTracker: DefaultAccountTracker | null = null;
  debitAccountManuallyChanged = signal(false);

  /** Loads the full postable account list once per component instance -- Debit can be any
   *  postable account (not limited to Cash/Bank like paymentAccounts), matching the generic
   *  Journal Entry screen's own account picker. */
  private loadDebitAccounts(): void {
    if (this.debitAccountsLoaded) return;
    this.debitAccountsLoaded = true;
    this.accountingService.getPostableAccounts().subscribe({
      next: accounts => this.debitAccounts.set(accounts ?? []),
      error: () => this.debitAccounts.set([])
    });
  }

  /** "Reset to Default" action next to an overridden Debit field. */
  resetDebitAccountToDefault(): void {
    this.debitAccountTracker?.reset();
    this.debitAccountManuallyChanged.set(false);
  }

  /** "+ Create Account" from this document, matching Receipt/Payment/Deposit's pattern. */
  openCreateDebitAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.debitAccounts.update(list => [...list, created]);
      this.purchaseInvoiceForm.get('debitAccountId')?.setValue(created.id);
    });
  }

  /** Re-derives the Debit-leg default from the current Store selection. */
  refreshDebitAccountDefault(): void {
    const control = this.purchaseInvoiceForm?.get('debitAccountId');
    if (!control) return;
    if (!this.debitAccountTracker) {
      this.debitAccountTracker = new DefaultAccountTracker(this.accountingService, control as any);
      control.valueChanges.subscribe(() =>
        this.debitAccountManuallyChanged.set(this.debitAccountTracker!.manuallyChanged));
    }
    const storeId = this.purchaseInvoiceForm.get('storeId')?.value;
    if (storeId) {
      this.debitAccountTracker.recalculate({ kind: DefaultAccountKind.PurchaseInvoiceDebit, storeId });
    }
  }

  // Filter controls for mat-select search
  supplierFilterCtrl = new FormControl('');
  paymentMethodFilterCtrl = new FormControl('');

  // Convert filter controls to signals
  private supplierFilterSignal = toSignal(this.supplierFilterCtrl.valueChanges, { initialValue: '' });
  private paymentMethodFilterSignal = toSignal(this.paymentMethodFilterCtrl.valueChanges, { initialValue: '' });

  // Filtered signals
 filteredSuppliers = computed(() => {

  const filter = this.supplierFilterSignal()?.toLowerCase() ?? '';

  return this.suppliers().filter(s =>
    s.name?.toLowerCase().includes(filter)
  );
});

  /** The single user-facing payment field source: the Payment Methods master (active only) via
   *  PaymentMethodService.activePaymentMethods$. The old hardcoded Cash/Credit (Deferred)/Bank
   *  Transfer/Check list is gone -- paymentMethod/paymentType are derived legacy strings from the
   *  selection (see deriveLegacyPaymentStrings), and the linked settlement account is auto-applied. */
  filteredPaymentMethods = computed(() => {
    const filter = (this.paymentMethodFilterSignal() || '').toLowerCase().trim();
    const methods = this.paymentMethodOptions();
    if (!filter) return methods;
    return methods.filter(m =>
      (m.nameAr || '').toLowerCase().includes(filter) ||
      (m.nameEn || '').toLowerCase().includes(filter) ||
      (m.paymentType || '').toLowerCase().includes(filter)
    );
  });

  // Layout for responsive design
  layout$ = this.currentSettingService.getCardLayout(4);

  // Edit mode signals
  isEditMode = signal(false);
  currentInvoiceId = signal<number | null>(null);
  invoiceNumberSignal = signal<string>('');
  /** True while a save / save-and-print round-trip is in flight (drives the shared toolbar's busy state). */
  saving = signal(false);

  // Additional Costs tab state -- the tab embeds the standalone list/form components (see
  // purchase-additional-cost-list/-form) instead of routing to them; toggling between the two
  // mirrors what routing between /purchase-additional-costs and /purchase-additional-costs/new
  // used to do, including relying on the list's own constructor-time refresh() when it's
  // recreated by *ngIf after the form closes.
  showAdditionalCostForm = signal(false);
  editingAdditionalCostId = signal<number | null>(null);

  onAdditionalCostAddRequested(): void {
    this.editingAdditionalCostId.set(null);
    this.showAdditionalCostForm.set(true);
  }

  onAdditionalCostEditRequested(id: number): void {
    this.editingAdditionalCostId.set(id);
    this.showAdditionalCostForm.set(true);
  }

  onAdditionalCostFormClosed(): void {
    this.showAdditionalCostForm.set(false);
    this.editingAdditionalCostId.set(null);
  }

  /** Snapshot of invoice.amountPaid as it was when this edit session was opened -- frozen so the
   *  totals preview can separate "already paid before now" from "being paid in this edit", the
   *  same distinction sales-invoice-form.component.ts's originalAmountPaid draws. 0 on create. */
  originalAmountPaid = signal(0);

  // Reactive Form
  purchaseInvoiceForm!: FormGroup;

  // Table columns for Material table
  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'lineTotal', 'actions'];

  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);

  /** Per-car allocated Additional Costs (Customs/Shipping/etc.) for THIS invoice, keyed by carId --
   *  purely informational display data, sourced from the same PurchaseAdditionalCost documents the
   *  "Additional Costs" tab manages. Never read by totalsRows()/totalAmount()/subtotal/VAT/grand
   *  total: those keep computing from invoiceItems() alone, unchanged. Only loaded in edit mode
   *  (Additional Costs can't exist before the invoice itself is saved -- see the tab's own
   *  *ngIf="currentInvoiceId()" guard). */
  private allocatedCostsByCarId = signal<Map<number, number>>(new Map());

  private loadAllocatedCostsForDisplay(invoiceId: number): void {
    this.purchaseAdditionalCostService.getAll().subscribe({
      next: response => {
        const docs = (response?.data || []).filter(d => d.purchaseInvoiceId === invoiceId);
        const byCarId = new Map<number, number>();
        for (const doc of docs) {
          for (const line of doc.lines || []) {
            byCarId.set(line.carId, (byCarId.get(line.carId) ?? 0) + line.allocatedAmount);
          }
        }
        this.allocatedCostsByCarId.set(byCarId);
      },
      error: () => this.allocatedCostsByCarId.set(new Map())
    });
  }

  /** Est. landed cost for one grid row = its own unit price + this invoice's allocated Additional
   *  Costs for that car. Informational only -- see allocatedCostsByCarId's comment. Returns null
   *  when there's nothing allocated yet, so the grid can show a plain dash instead of a misleading
   *  "+0" figure. */
  estimatedLandedCost = (rowData: InvoiceItem): number | null => {
    const allocated = this.allocatedCostsByCarId().get(rowData.carId);
    if (!allocated) return null;
    return (rowData.unitPrice ?? 0) + allocated;
  };

  hasAnyAllocatedCosts(): boolean {
    return this.allocatedCostsByCarId().size > 0;
  }

  // Auction purchase state -- only meaningful when isAuctionPurchase is checked; the backend's
  // AuctionPurchaseService is the actual authority on provider validation/charge rules, this is
  // just the form's data entry surface.
  auctionProviders = ['BCA', 'Copart', 'Manheim'];
  auctionCharges = signal<AuctionCharge[]>([]);

  addAuctionCharge(): void {
    this.auctionCharges.update(charges => [...charges, { chargeType: '', amount: 0 }]);
  }

  removeAuctionCharge(index: number): void {
    this.auctionCharges.update(charges => charges.filter((_, i) => i !== index));
  }

  auctionChargesTotal(): number {
    return this.auctionCharges().reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }

  // Car Receipts (GRN) linking state
  openCarReceipts = signal<CarReceipt[]>([]);
  selectedReceiptIds = signal<number[]>([]);
  linkedReceiptIds = signal<number[]>([]);

  // Cars Receipt Notes (formal PO->GRN cycle) linking state -- merged into the same dropdown as
  // openCarReceipts above. Unlike CarReceipt, a note line has no CarId, so applying one prompts
  // the user to pick a car per line via CarSelectionDialogComponent.
  openReceiptNotes = signal<CarsReceiptNoteDto[]>([]);
  selectedDropdownKeys = signal<string[]>([]);

  // Traceability: the currently linked GRNs, for the lineage trail in the action bar
  linkedReceipts = computed(() =>
    this.openCarReceiptsHistory().filter(r => this.linkedReceiptIds().includes(r.id))
  );
  private openCarReceiptsHistory = signal<CarReceipt[]>([]);

  hasGrnLineage = computed(() => this.linkedReceiptIds().length > 0);

  // Temp state for adding a new item
  selectedCarId = signal<number | null>(null);
  selectedQuantity = signal(1);
  purchasePrice = signal(0);
  selectedCar = signal<Car | null>(null);

  // Invoice type signal
  invoiceType = signal<InvoiceType>(InvoiceType.Taxable);

  // Invoice classification signals
  invoiceClassifications = signal<InvoiceClassificationOption[]>([]);
  selectedInvoiceClassification = signal<InvoiceClassificationOption | null>(null);

  // Payment method signal
  paymentMethodSignal = signal<string>('Bank Transfer');

  // Computed properties
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  
  vatAmount = computed(() => {
    const classification = this.selectedInvoiceClassification();
    const subtotalValue = this.subtotal();

    if (classification && classification.vatRate > 0) {
      // Apply VAT rate from selected classification -- rounded to 2dp (currency precision), not
      // left as a raw float: 12 * (15/100) alone can carry floating-point noise (e.g.
      // 1.7999999999999998), which would then propagate into totalAmount below.
      return Math.round((subtotalValue * (classification.vatRate / 100) + Number.EPSILON) * 100) / 100;
    }

    // No VAT for zero-rated or exempt classifications
    return 0;
  });

  // Auction charges are folded in on top of the item subtotal+VAT, matching the backend
  // (PurchaseInvoiceService.CreateAsync: totalAmount = createDto.TotalAmount + auctionChargesTotal).
  // Rounded to 2dp (currency precision) -- NOT to the nearest whole riyal: a plain Math.round(sum)
  // here used to turn e.g. subtotal 12 + VAT 1.80 = 13.80 into a displayed/saved 14.00.
  totalAmount = computed(() => Math.round((this.subtotal() + this.vatAmount() + this.auctionChargesTotal() + Number.EPSILON) * 100) / 100);

  /** True when the current payment type is cash - drives the auto-paid summary + cash calculator.
   *  Signal-backed: paymentType is now DERIVED from the single Payment Method master selection
   *  (see watchPaymentMethodIdControl), so it changes at runtime and must stay reactive.
   *  Cash-locked wrappers (PurchaseCashInvoiceComponent) fix the settlement by contract: the
   *  derived string must never override the lock -- not before the master loads, and not when the
   *  matched master row itself carries a non-Cash paymentType. Without this guard a CASH invoice
   *  rendered as credit: the "Initial Payment" section appeared, the supplier-AP account check ran
   *  on save, and the header badge showed Unpaid. */
  paymentTypeSignal = signal<string>('Bank Transfer');
  isCashPayment = computed(() => {
    if (this.lockPaymentMethod && String(this.fixedPaymentMethod ?? '').trim().toLowerCase() === 'cash') {
      return true;
    }
    // Settlement semantics (spec §2): only Credit/Installment/deferred-typed methods are credit.
    // Cash/Bank/Card/BankTransfer/Check/Other all settle IMMEDIATELY, so the form must render the
    // cash calculator ("المبلغ المستلم") for them -- and never the "Initial Payment" section or
    // the supplier-AP account check. Previously ANY non-'Cash' string (including this 'Bank
    // Transfer' default and Bank/Card methods) rendered the document as credit on CREATE.
    return !isDeferredSettlementType(this.paymentTypeSignal());
  });

  /**
   * Cash/Bank settlement accounts for CASH purchases (credit leg: Dr Inventory / Cr Payment
   * Account). Loaded ONCE from the existing backend endpoint
   * `accounts/postable?category=cash-bank` (active + postable + Cash/Bank classified only) --
   * no client-side accounting classification. The backend re-validates any selected id.
   */
  paymentAccounts = signal<Account[]>([]);
  private paymentAccountsLoaded = false;

  /** Centralized Payment Methods master (active only) -- THE single user-facing payment field of
   *  this document (see filteredPaymentMethods / the paymentMethodId selector). */
  paymentMethodOptions = signal<PaymentMethod[]>([]);

  /** Loads the Cash/Bank options exactly once per component instance. */
  private loadPaymentAccounts(): void {
    if (this.paymentAccountsLoaded) return;
    this.paymentAccountsLoaded = true;
    this.accountingService.getPostableAccounts('cash-bank').subscribe({
      next: accounts => this.paymentAccounts.set(accounts ?? []),
      error: () => this.paymentAccounts.set([])
    });
  }

  /** The Payment Method master IS the one payment field: selecting a method derives the legacy
   *  paymentMethod/paymentType payload strings (API compatibility), auto-applies the method's
   *  linked account as the paymentAccountId settlement default, and re-drives the Cash/Credit
   *  branching (cash calculator vs due date) through the paymentType/paymentMethod signals. */
  private watchPaymentMethodIdControl(): void {
    this.paymentMethodService.activePaymentMethods$.subscribe(methods => {
      this.paymentMethodOptions.set(methods);
      this.autoSelectPaymentMethod(methods);
    });

    this.purchaseInvoiceForm.get('paymentMethodId')?.valueChanges.subscribe((id: number | null) => {
      const method = this.paymentMethodOptions().find((m: PaymentMethod) => m.id === id);
      if (!method) return;

      // ONE field in, everything else derived: legacy strings (payload compatibility)...
      const legacy = deriveLegacyPaymentStrings(method);
      // Cash-locked wrapper: the document is Cash by definition, so a master row whose own
      // paymentType was mis-typed (e.g. 'Bank') must not flip the settlement back to credit --
      // force the derived strings to Cash while keeping the method's linked settlement account.
      const cashLocked = this.lockPaymentMethod && String(this.fixedPaymentMethod ?? '').trim().toLowerCase() === 'cash';
      const derivedType = cashLocked ? 'Cash' : legacy.paymentType;
      this.purchaseInvoiceForm.get('paymentType')?.setValue(derivedType);
      this.purchaseInvoiceForm.get('paymentMethod')?.setValue(derivedType === 'Cash' ? 'Cash' : legacy.paymentMethod);
      // ...and the settlement account from the method's linked account.
      this.purchaseInvoiceForm.get('paymentAccountId')?.setValue(method.accountId);
    });

    // Keep the signal-backed Cash/Credit branching in sync with the derived controls.
    this.purchaseInvoiceForm.get('paymentType')?.valueChanges.subscribe(v => {
      this.paymentTypeSignal.set((v ?? '').toString());
      // Cash/Bank settlement account requirement flips with cash/credit: keep the control's
      // validators synced whenever the derived payment type changes.
      this.refreshPaymentAccountValidation();
    });
    this.purchaseInvoiceForm.get('paymentMethod')?.valueChanges.subscribe(v => this.paymentMethodSignal.set((v ?? '').toString()));
  }

  /** Prefills the single Payment Method selector without user interaction: Cash/Credit-locked
   *  wrappers resolve to the first master method of that type, and legacy documents saved before
   *  paymentMethodId existed are matched back to the master by their stored strings. Never
   *  overrides a value that is already set. */
  private autoSelectPaymentMethod(methods: PaymentMethod[]): void {
    const control = this.purchaseInvoiceForm?.get('paymentMethodId');
    if (!control || control.value != null) return;

    if (this.lockPaymentMethod && this.fixedPaymentMethod) {
      const wanted = String(this.fixedPaymentMethod).toLowerCase();
      const match = methods.find(m => {
        const t = (m.paymentType || '').toLowerCase();
        return t === wanted || (m.nameEn || '').toLowerCase() === wanted;
      });
      // Found in the master -> select it (setValue works on the locked/disabled control).
      // Not found -> keep the legacy locked paymentMethod/paymentType strings untouched so the
      // document still saves exactly as it did before the master existed.
      if (match) control.setValue(match.id);
      return;
    }

    // Edit mode only: legacy documents carry paymentMethod/paymentType but no paymentMethodId.
    if (!this.isEditMode()) return;
    const matchedId = matchLegacyPaymentMethodId(methods, {
      paymentMethod: this.purchaseInvoiceForm.get('paymentMethod')?.value,
      paymentType: this.purchaseInvoiceForm.get('paymentType')?.value
    });
    if (matchedId != null) control.setValue(matchedId);
  }

  /** Keeps the Payment Account control in sync with the settlement type: required (and kept)
   * on CASH, cleared + optional on CREDIT so a previously chosen cash account is never sent
   * with a credit document. */
  private refreshPaymentAccountValidation(): void {
    const control = this.purchaseInvoiceForm?.get('paymentAccountId');
    if (!control) return;
    // OPTIONAL on cash too: when no Payment Method/account is chosen the backend falls back to
    // the tenant's seeded default Cash account (ResolvePaymentAccountAsync's documented
    // fallback). A hard client-side `required` here used to keep Save/Save&Print permanently
    // disabled on cash invoices whenever no method was preselectable, with every other field
    // correctly filled.
    control.clearValidators();
    if (!this.isCashPayment()) {
      // Credit -> drop any previously chosen cash account so it can never leak into a credit payload.
      control.reset({ value: null, emitEvent: false });
    }
    control.updateValueAndValidity();
  }

  /** True for either the base route's own dropdown value ('Credit (Deferred)') or, when locked
   * via a Cash/Credit wrapper, the lowercase 'credit' fixedPaymentMethod value -- drives the Due
   * Date field's visibility for both the unlocked and locked Purchase Invoice flows. */
  isCreditPayment = computed(() => {
    // Same deferred-settlement rule as isCashPayment (kept in sync via the shared helper) so the
    // Due Date field and the cash/credit sections can never disagree about the settlement type.
    return isDeferredSettlementType(this.paymentMethodSignal());
  });

  /** Amount received from the cash calculator (cash invoices) or the initial-payment field (credit invoices). */
  amountReceivedSignal = signal(0);

  /** Live preview of AmountPaid/AmountDue/Status - mirrors InvoicePaymentCalculator.Recalculate on the backend. */
  previewAmountPaid = computed(() => {
    const total = this.totalAmount();
    const raw = this.isCashPayment() ? total : Math.max(0, this.amountReceivedSignal());
    return Math.min(total, raw);
  });

  previewAmountDue = computed(() => Math.max(0, this.totalAmount() - this.previewAmountPaid()));

  /** Portion of previewAmountPaid() that was already paid before this edit session opened (0 on
   *  create, since there's nothing "previous" yet) -- the "Previously Paid" row. */
  previousPayments = computed(() => this.isEditMode() ? Math.min(this.previewAmountPaid(), this.originalAmountPaid()) : 0);

  /** The actual amount being applied in this create/edit -- everything in previewAmountPaid()
   *  beyond what was already paid before. On create this equals previewAmountPaid() itself
   *  (nothing "previous" to subtract); on edit it's only the newly-added delta, mirroring
   *  sales-invoice-form.component.ts's previousPayments/currentPayment split. */
  currentPayment = computed(() => Math.max(0, this.previewAmountPaid() - this.previousPayments()));

  previewStatus = computed(() => {
    if (this.totalAmount() <= 0) return 'PURCHASE_INVOICE.STATUS_UNPAID';
    if (this.previewAmountDue() <= 0) return 'PURCHASE_INVOICE.STATUS_PAID';
    if (this.previewAmountPaid() > 0) return 'PURCHASE_INVOICE.STATUS_PARTIALLY_PAID';
    return 'PURCHASE_INVOICE.STATUS_UNPAID';
  });

  onAmountReceivedChange(value: number): void {
    this.amountReceivedSignal.set(value || 0);
  }

  /** True when any line's car uses the ZATCA profit-margin VAT scheme -- the server computes the
   *  authoritative Subtotal/VATAmount for those lines from (unit price - prior car cost), which
   *  can differ from the standard rate-on-price estimate shown above before saving. */
  hasMarginVatItems = computed(() => {
    const carsList = this.cars() ?? [];
    return this.invoiceItems().some(item => {
      const car = carsList.find((c: any) => c.id === item.carId);
      return !!car?.calculateVATFromProfitMargin;
    });
  });

  // Back route computed property
  backRoute = computed(() => {
    const method = this.paymentMethodSignal();
    if (method === 'Cash') {
      return '/purchases/invoice/cash';
    } else if (method === 'Credit (Deferred)') {
      return '/purchases/invoice/credit';
    }
     return '/purchases/invoice/cash';
  });

  constructor() {
  }

  /**
   * Angular lifecycle method - called after component initialization
   */
  ngOnInit(): void {
    // Load current user information
    this.oidcSecurityService.getUserData().subscribe(userData => {
      if (userData && userData.sub) {
        // Assuming 'sub' contains the user ID or you have userId in userData
        this.currentUserId.set(parseInt(userData.sub) || 1);
      }
    });

    // Load invoice classifications from API
    this.currentSettingService.getInvoiceClassifications().subscribe(classifications => {
      this.invoiceClassifications.set(classifications);
      // Set default classification if available
      if (classifications.length > 0) {
        this.selectedInvoiceClassification.set(classifications[0]);
        // Update form with default classification
        this.purchaseInvoiceForm?.patchValue({
          ClassificationId: classifications[0].value
        });
      }
    });

    // Moved here from the constructor: @Input()s (lockPaymentMethod/fixedPaymentMethod) are not
    // yet set when the constructor runs, so triggering the edit-mode load from there meant
    // handlePaymentMethodLocking() -- fired by ngOnChanges right after construction -- always
    // saw purchaseInvoiceForm as undefined and silently never locked the field in edit mode.
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.isEditMode.set(true);
      this.currentInvoiceId.set(+invoiceId);
      this.loadInvoiceForEdit(+invoiceId);
    } else {
      this.initForm();
      this.watchInitialPaymentControl();
      this.watchDebitAccountDefault();

      // A new invoice always belongs to the caller's current Showroom (StoreContextService),
      // selected once after login -- initialize the derived store state (car stock, heads-up
      // accounting-config warning) the same way onStoreSelectionChange used to for a user pick.
      const initialStoreId = this.purchaseInvoiceForm.get('storeId')?.value;
      if (initialStoreId) {
        this.initializeStoreState(initialStoreId);
      }
    }

    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });

    // GRN dropdown is not gated behind supplier selection -- picking a GRN inherits and locks the supplier.
    this.loadUninvoicedReceipts();
    this.loadUninvoicedReceiptNotes();
  }

  /** Un-invoiced GRNs across all suppliers -- the eligible dropdown source for this screen. */
  loadUninvoicedReceipts(): void {
    this.purchaseCycleService.getUninvoicedReceipts().subscribe({
      next: (receipts: any) => {
        const list: CarReceipt[] = Array.isArray(receipts) ? receipts : (receipts?.data ?? []);
        this.openCarReceipts.set(list);
        this.openCarReceiptsHistory.update(history => {
          const merged = [...history];
          for (const receipt of list) {
            if (!merged.some(r => r.id === receipt.id)) {
              merged.push(receipt);
            }
          }
          return merged;
        });
      },
      error: (err) => {
        console.error('Error loading uninvoiced car receipts', err);
        this.openCarReceipts.set([]);
      }
    });
  }

  /** Posted GRNs (formal PO->GRN cycle) with at least one un-invoiced line -- merged into the same dropdown as openCarReceipts. */
  loadUninvoicedReceiptNotes(): void {
    this.carsReceiptNoteService.getUninvoiced().subscribe({
      next: (notes: any) => {
        this.openReceiptNotes.set(Array.isArray(notes) ? notes : (notes?.data ?? []));
      },
      error: (err) => {
        console.error('Error loading uninvoiced receipt notes', err);
        this.openReceiptNotes.set([]);
      }
    });
  }

  onReceiptSelectionChanged(e: any): void {
    this.selectedReceiptIds.set((e.selectedRowKeys || []) as number[]);
  }

  /** Selecting a delivery note applies it to the invoice grid immediately -- no separate "apply" step.
   * Dropdown values are composite keys ("cr:<id>" for CarReceipt, "note:<id>" for CarsReceiptNote) since
   * the two sources have independent id spaces. */
  onReceiptDropdownChange(keys: string[]): void {
    this.selectedDropdownKeys.set(keys);

    const receiptIds = keys.filter(k => k.startsWith('cr:')).map(k => +k.slice(3));
    const noteIds = keys.filter(k => k.startsWith('note:')).map(k => +k.slice(5));

    if (receiptIds.length > 0) {
      this.selectedReceiptIds.set(receiptIds);
      this.applySelectedReceipts();
    }
    if (noteIds.length > 0) {
      this.applySelectedReceiptNotes(noteIds);
    }
  }

  /** CarsReceiptNote lines carry their own carId (picked at GRN creation time), so this applies
   * directly -- same shape as applySelectedReceipts(), just keyed by carsReceiptNoteItemId. */
  applySelectedReceiptNotes(noteIds: number[]): void {
    const notes = this.openReceiptNotes().filter(n => noteIds.includes(n.id));
    if (notes.length === 0) return;

    const items = [...this.invoiceItems()];
    let skippedForMissingCar = false;

    for (const note of notes) {
      for (const line of note.items || []) {
        const invoiceQty = line.remainingToInvoice;
        if (invoiceQty <= 0) continue;

        // Lines created before car-level tracking was added have no carId -- can't invoice these.
        if (!line.carId) {
          skippedForMissingCar = true;
          continue;
        }

        const existingIndex = items.findIndex(i => i.carsReceiptNoteItemId === line.id);

        if (existingIndex !== -1) {
          items[existingIndex] = {
            ...items[existingIndex],
            quantity: invoiceQty,
            unitPrice: line.unitPrice,
            lineTotal: invoiceQty * line.unitPrice
          };
        } else {
          items.push({
            carId: line.carId,
            carsReceiptNoteItemId: line.id,
            carDescription: line.carDescription,
            quantity: invoiceQty,
            unitPrice: line.unitPrice,
            lineTotal: invoiceQty * line.unitPrice
          });
        }
      }
    }

    this.invoiceItems.set(items);
    this.openReceiptNotes.update(list => list.filter(n => !noteIds.includes(n.id)));
    this.selectedDropdownKeys.update(keys => keys.filter(k => !(k.startsWith('note:') && noteIds.includes(+k.slice(5)))));

    if (skippedForMissingCar) {
      this.notificationService.showWarning(this.translate.instant('PURCHASE_INVOICE.NOTE_LINE_MISSING_CAR'));
    }
    this.notificationService.showSuccess(this.translate.instant('PURCHASE_INVOICE.RECEIPTS_APPLIED'));
  }

  getReceiptItemsCount(receipt: CarReceipt): number {
    return receipt.items ? receipt.items.length : 0;
  }

  getReceiptTotal(receipt: CarReceipt): number {
    return (receipt.items || []).reduce((sum, line) => sum + line.remainingToInvoice * line.unitPrice, 0);
  }

  applySelectedReceipts(): void {
    const receipts = this.openCarReceipts().filter(r => this.selectedReceiptIds().includes(r.id));
    if (receipts.length === 0) return;

    const currentSupplierId = this.purchaseInvoiceForm.get('supplierId')?.value;
    const mismatchedSupplier = receipts.find(r => currentSupplierId && r.supplierId !== currentSupplierId);
    if (mismatchedSupplier) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.RECEIPT_SUPPLIER_MISMATCH'));
      return;
    }

    // Supplier is inherited from the selected GRN(s) and locked -- financial matching requires a single supplier.
    if (!currentSupplierId) {
      this.purchaseInvoiceForm.patchValue({ supplierId: receipts[0].supplierId });
      this.purchaseInvoiceForm.get('supplierId')?.disable();
    }

    const items = [...this.invoiceItems()];

    for (const receipt of receipts) {
      for (const line of receipt.items || []) {
        // Default to what's still eligible to invoice on this line -- supports invoicing the same
        // receipt across multiple invoices without double-billing an already-invoiced quantity.
        const invoiceQty = line.remainingToInvoice;
        if (invoiceQty <= 0) continue;

        // Keyed by the specific GRN line (not carId) so quantity edits always trace back to exactly
        // one CarReceiptItem -- the backend advances that line's invoiced total from this id.
        const existingIndex = items.findIndex(i => i.carReceiptItemId === line.id);

        if (existingIndex !== -1) {
          const existing = items[existingIndex];
          const newQuantity = existing.quantity + invoiceQty;
          const newUnitPrice = ((existing.unitPrice ?? 0) * existing.quantity + line.unitPrice * invoiceQty) / newQuantity;
          items[existingIndex] = {
            ...existing,
            quantity: newQuantity,
            unitPrice: newUnitPrice,
            lineTotal: newQuantity * newUnitPrice
          };
        } else {
          items.push({
            carId: line.carId,
            carReceiptItemId: line.id,
            carDescription: line.carDescription,
            receivedQuantity: line.quantity,
            quantity: invoiceQty,
            unitPrice: line.unitPrice,
            lineTotal: invoiceQty * line.unitPrice
          });
        }
      }
    }

    this.invoiceItems.set(items);
    this.linkedReceiptIds.update(ids => Array.from(new Set([...ids, ...receipts.map(r => r.id)])));
    this.openCarReceipts.update(list => list.filter(r => !this.selectedReceiptIds().includes(r.id)));
    this.selectedDropdownKeys.update(keys => keys.filter(k => !(k.startsWith('cr:') && this.selectedReceiptIds().includes(+k.slice(3)))));
    this.selectedReceiptIds.set([]);

    this.notificationService.showSuccess(this.translate.instant('PURCHASE_INVOICE.RECEIPTS_APPLIED'));
  }

  /**
   * Get the translated title for the invoice
   */
  getTitle(): string {
    if (!this.customTitle) {
      return this.translate.instant('PURCHASE_INVOICE.CREATE_TITLE');
    }
    return this.fixedPaymentMethod === 'credit'
      ? this.translate.instant('PURCHASE_INVOICE.CREDIT_INVOICE_TITLE')
      : this.translate.instant('PURCHASE_INVOICE.CASH_INVOICE_TITLE');
  }

  /**
   * Angular lifecycle method - called when input properties change
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Handle payment method locking when inputs change
    if (changes['lockPaymentMethod'] || changes['fixedPaymentMethod']) {
      this.handlePaymentMethodLocking();
    }
  }

  /**
   * Locks paymentMethod (the field dueDateValidator and downstream logic actually key off) to
   * fixedPaymentMethod when this instance is wrapped by a Cash/Credit-fixed component. Previously
   * patched paymentType but disabled the different paymentMethod control -- fixed here so both
   * agree, and paymentType is kept in sync too since isCashPayment() reads that one.
   */
  private handlePaymentMethodLocking(): void {
    if (!this.purchaseInvoiceForm || !this.lockPaymentMethod || !this.fixedPaymentMethod) {
      return;
    }
    applyFieldLock(this.purchaseInvoiceForm.get('paymentMethod'), { value: this.fixedPaymentMethod, disable: false });
    applyFieldLock(this.purchaseInvoiceForm.get('paymentType'), { value: this.fixedPaymentMethod, disable: true });
    // The Payment Method selector stays EDITABLE: the user picks the instrument (Cash/Bank/Card/)
    // and its linked account becomes the settlement leg. On a Cash-locked wrapper the settlement
    // TYPE still cannot drift -- the paymentMethodId valueChanges handler forces the derived
    // strings to 'Cash' and the backend treats an explicit client PaymentType=Cash as
    // authoritative -- so choosing e.g. a Bank method only changes WHICH Cash/Bank account the
    // entry posts to, never cash -> credit. (autoSelectPaymentMethod may still preselect the
    // matching master method when the master loads.)
    applyFieldLock(this.purchaseInvoiceForm.get('paymentMethodId'), { value: null, disable: false });
    this.paymentMethodSignal.set(this.fixedPaymentMethod);
    this.paymentTypeSignal.set(String(this.fixedPaymentMethod ?? ''));
  }



  /**
   * Handle payment method locking based on input properties
   */

  private initForm(): void {
    this.purchaseInvoiceForm = this.fb.group({
      supplierId: [null, Validators.required],
      // No Store picker anymore -- a new invoice always belongs to the caller's current Showroom.
      storeId: [this.storeContext.current()?.storeId ?? null, Validators.required],
      // Debit (Inventory/Expense) account override -- default-preselected via
      // DefaultAccountTracker (see refreshDebitAccountDefault), user-editable, and re-validated
      // server-side on save. Null (never touched) falls back to the backend's existing
      // derivation. No creditAccountId control: the Credit leg (Supplier AP or Cash/Bank) is this
      // document's system-resolved side and is never accepted from this form.
      debitAccountId: [null as number | null],
      invoiceDate: [new Date(), Validators.required],
      paymentMethod: [this.fixedPaymentMethod , Validators.required],
      paymentType: [this.fixedPaymentMethod || 'Bank Transfer'],
      // Cash/Bank settlement account (CASH purchases only -- see the model doc). The backend
      // falls back to the tenant's seeded default Cash when this is omitted.
      paymentAccountId: [null as number | null],
      // Link to the Payment Methods master -- purely additive, optional selector that offers its
      // linked account as the paymentAccountId default; the existing paymentMethod/paymentType
      // fields and their credit/cash branching are untouched.
      paymentMethodId: [null as number | null],
      dueDate: [null], // Optional, required only for credit invoices
      invoiceType: [InvoiceType.Taxable, Validators.required],
      ClassificationId: [0, Validators.required],
      initialPayment: [0, [Validators.min(0)]],
      notes: [''],
      isAuctionPurchase: [false],
      auctionProvider: [null],
      auctionLotNumber: ['']
    }, { validators: [this.dueDateValidator] });

    // Set payment method signal
    this.paymentMethodSignal.set(this.fixedPaymentMethod || 'Bank Transfer');
    // Seed the Cash/Credit branching signal from the form's initial paymentType value (which is
    // fixedPaymentMethod itself). Only paymentMethodSignal used to be seeded here, so a CASH
    // wrapper started with the signal's 'Bank Transfer' default and rendered as credit -- Initial
    // Payment section visible, supplier AP check armed, Unpaid badge -- until some control event
    // happened to update the signal. The valueChanges subscription below only fires on CHANGES,
    // never for the initial value.
    this.paymentTypeSignal.set(this.purchaseInvoiceForm.get('paymentType')?.value || this.fixedPaymentMethod || 'Bank Transfer');

    // Set initial invoice type
    this.invoiceType.set(InvoiceType.Taxable);

    // Payment Account options + cash/credit validation sync.
    this.loadPaymentAccounts();
    this.refreshPaymentAccountValidation();
    this.watchPaymentMethodIdControl();

    // Debit account options + default preview.
    this.loadDebitAccounts();
    this.refreshDebitAccountDefault();

    // Re-apply the Cash/Credit lock now that the form actually exists. ngOnChanges fires this
    // before ngOnInit -- i.e. while purchaseInvoiceForm is still undefined -- so its early return
    // silently skipped every lock, leaving the payment method selector editable and the derived
    // cash/credit state unpinned on Cash/Credit-locked wrapper screens.
    this.handlePaymentMethodLocking();
  }

  /** Keeps amountReceivedSignal (used by the live Paid/Due/Status preview) in sync with the
   * initialPayment form control for credit invoices. */
  private watchInitialPaymentControl(): void {
    this.purchaseInvoiceForm.get('initialPayment')?.valueChanges.subscribe((value: number) => {
      if (!this.isCashPayment()) {
        this.amountReceivedSignal.set(Number(value) || 0);
      }
    });
    this.purchaseInvoiceForm.get('paymentType')?.valueChanges.subscribe(() => {
      // Cash always fully paid; switching back to credit falls back to the initialPayment field.
      if (!this.isCashPayment()) {
        this.amountReceivedSignal.set(Number(this.purchaseInvoiceForm.get('initialPayment')?.value) || 0);
      }
      // Cash -> Credit must drop any previously chosen payment account so it can never leak
      // into a credit payload; Credit -> Cash re-enables the requirement.
      this.refreshPaymentAccountValidation();
    });
  }

  /** Keeps the Debit default preview in sync with the Store selection it depends on. Mirrors
   *  refreshPaymentAccountValidation's own trigger wiring. */
  private watchDebitAccountDefault(): void {
    this.purchaseInvoiceForm.get('storeId')?.valueChanges.subscribe(() => this.refreshDebitAccountDefault());
  }

  /** paymentMethod holds either the base route's own dropdown value ('Credit (Deferred)') or,
   * when locked via a Cash/Credit wrapper, the lowercase 'cash'/'credit' fixedPaymentMethod value
   * -- match both shapes so a locked Credit Purchase Invoice still requires a due date. */
  private dueDateValidator(group: AbstractControl): { [key: string]: any } | null {
    const paymentMethod = (group.get('paymentMethod')?.value ?? '').toString().toLowerCase();
    const dueDate = group.get('dueDate')?.value;
    // Same deferred-settlement rule as isCashPayment/isCreditPayment: Credit (Deferred)/Credit/
    // Installment (آجل/تقسيط) require a due date; immediately-settled methods never do.
    const isCredit = isDeferredSettlementType(paymentMethod);

    if (isCredit && !dueDate) {
      return { dueDateRequired: true };
    }

    return null;
  }

  loadInvoiceForEdit(invoiceId: number): void {
    // PurchasesService.getInvoiceById() now unwraps the backend's { success, message, data }
    // envelope itself, so `invoice` here is a flat PurchaseInvoice -- matching its declared type
    // and how every other consumer (PrintablePurchaseInvoiceComponent, saveInvoice() below) reads
    // it. Previously this method read `invoice.data.xxx` for every header field (a workaround for
    // the un-unwrapped envelope) but `invoice.data.items` for the line items -- since the service
    // now does the unwrapping, `invoice.items` is the correct, and only, way to read it.
    this.procurementService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Initialize form with existing invoice data
        this.purchaseInvoiceForm = this.fb.group({
          supplierId: [invoice.supplierId, Validators.required],
          storeId: [invoice.storeId, Validators.required],
          // Preselect with the invoice's own STORED Debit account -- never silently recomputed on
          // load (Requirement 3). See the tracker markAsManuallyChanged() call below for why the
          // control must be told this is already a real saved value, not a freshly resolved
          // default. No creditAccountId control -- see initForm()'s comment; invoice.creditAccountId
          // (already resolved by the backend) is only used read-only, e.g. on the printable invoice.
          debitAccountId: [invoice.debitAccountId ?? null] as [number | null],
          invoiceDate: [new Date(invoice.invoiceDate), Validators.required],
          paymentMethod: [invoice.paymentMethod || 'Bank Transfer'],
          paymentType: [invoice.paymentType || 'credit'],
          // Cash invoices persist their payment account in CreditAccountId server-side
          // (the cash entry's credit leg) -- preselect it so edit mode shows the stored one.
          paymentAccountId: [
            // Restore the stored Cash/Bank settlement account for any IMMEDIATELY-settled
            // invoice (Cash/Bank/BankTransfer/Card/... -- the master's own type string, not just
            // the literal lowercase 'cash'); deferred invoices have no payment account.
            !isDeferredSettlementType(invoice.paymentType) ? (invoice.creditAccountId ?? null) : null
          ] as [number | null],
          paymentMethodId: [invoice.paymentMethodId ?? null] as [number | null],
          dueDate: [invoice.dueDate ? new Date(invoice.dueDate) : null],
          invoiceType: [invoice.invoiceType || InvoiceType.Taxable, Validators.required],
          ClassificationId: [invoice.ClassificationId || 0, Validators.required],
          initialPayment: [invoice.initialPayment || 0, [Validators.min(0)]],
          notes: [invoice.notes || ''],
          isAuctionPurchase: [!!invoice.auctionProvider],
          auctionProvider: [invoice.auctionProvider || null],
          auctionLotNumber: [invoice.auctionLotNumber || ''],
        }, { validators: [this.dueDateValidator] });

        // Seed the Cash/Credit branching signals from the LOADED invoice's stored payment strings
        // (same contract as initForm()'s seeding): the valueChanges subscriptions registered by
        // watchPaymentMethodIdControl only fire on CHANGES -- never for a control's initial value --
        // and autoSelectPaymentMethod only fixes the signals when the Payment Methods master happens
        // to contain a matching row. Without this explicit seed a saved CASH invoice opened for edit
        // kept the class default 'Bank Transfer' and rendered as CREDIT: the "Initial Payment"
        // section replaced the cash calculator ("المبلغ المستلم"), the supplier-AP "link account"
        // check armed on save, and the header badge showed Unpaid.
        this.paymentMethodSignal.set(this.purchaseInvoiceForm.get('paymentMethod')?.value || 'Bank Transfer');
        this.paymentTypeSignal.set(this.purchaseInvoiceForm.get('paymentType')?.value || this.paymentMethodSignal() || 'Bank Transfer');

        this.auctionCharges.set(invoice.auctionCharges || []);
        if (invoice.storeId) {
          this.initializeStoreState(invoice.storeId);
        }

        // ngOnChanges may have already fired (before this async form existed) and found nothing
        // to lock -- apply the lock explicitly now that the real edit-mode form exists, so a
        // Cash/Credit-fixed invoice opened for edit is actually locked, not just on create.
        this.handlePaymentMethodLocking();

        this.amountReceivedSignal.set(invoice.initialPayment || invoice.amountPaid || 0);
        this.originalAmountPaid.set(invoice.amountPaid || 0);
        this.watchInitialPaymentControl();
        this.watchDebitAccountDefault();

        // Payment Account options + cash/credit validation sync for the edit form.
        this.loadPaymentAccounts();
        this.refreshPaymentAccountValidation();
        this.watchPaymentMethodIdControl();

        // Debit account options for the edit form. Construct the tracker BEFORE any recalculate()
        // call can fire, and -- since the control's initial value was set via the FormControl(...)
        // constructor above rather than a later patchValue/setValue the tracker's own valueChanges
        // subscription would see as a "manual change" -- explicitly mark it manual right now when
        // a saved value is already present. Otherwise a loaded invoice's real saved account could
        // be silently overwritten by a freshly resolved default the first time
        // refreshDebitAccountDefault runs.
        this.loadDebitAccounts();
        const debitAccountControl = this.purchaseInvoiceForm.get('debitAccountId') as any;
        this.debitAccountTracker = new DefaultAccountTracker(this.accountingService, debitAccountControl);
        if (debitAccountControl.value != null) {
          this.debitAccountTracker.markAsManuallyChanged();
        }
        this.debitAccountManuallyChanged.set(this.debitAccountTracker.manuallyChanged);
        debitAccountControl.valueChanges.subscribe(() =>
          this.debitAccountManuallyChanged.set(this.debitAccountTracker!.manuallyChanged));

        // Set invoice number signal
        this.invoiceNumberSignal.set(invoice.invoiceNumber);

        // Set invoice type signal
        this.invoiceType.set((invoice.invoiceType as InvoiceType) || InvoiceType.Taxable);

        // Set invoice items -- this is what populates the DevExtreme grid (bound to
        // invoiceItems() in the template). Re-assigning the signal triggers change detection on
        // its own; no manual ChangeDetectorRef/grid.instance.option() call is needed here.
        this.invoiceItems.set(invoice.items || []);

        // Informational "Est. landed cost" data for the grid -- see allocatedCostsByCarId's comment.
        this.loadAllocatedCostsForDisplay(invoiceId);

        // Baseline the dirty-tracking snapshot for the freshly loaded document.
        this.captureDocumentSnapshot();

        // Restore linked Car Receipts
        this.linkedReceiptIds.set(invoice.carReceiptIds || []);
        this.loadUninvoicedReceipts();
      },
      error: (error) => {
        console.error('Failed to load invoice for edit', error);
        // Navigate back to procurement list on error
        this.router.navigate(['/procurement']);
      }
    });
  }

  // Methods
  loadCarStocks(storeId: number): void {
    this.salesService.getStocksByStore(storeId).subscribe({
      next: (stocks) => {
        this.carStocks.set(stocks);
        console.log('Car stocks loaded for store:', storeId, stocks);
      },
      error: (error) => {
        console.error('Failed to load car stocks:', error);
        this.carStocks.set([]);
      }
    });
  }

  /** Loads car stock and warns if the Store has no active StoreAccountingConfiguration -- used to
   *  run on a user's (selectionChange), now runs once when the storeId is first known (current
   *  Showroom for a new invoice, saved value for an edit), since there's no more Store dropdown. */
  private initializeStoreState(storeId: number | null): void {
    if (storeId) {
      this.loadCarStocks(storeId);
    } else {
      this.carStocks.set([]);
    }

    // Heads-up only: warns the user immediately if the selected Store has no active
    // StoreAccountingConfiguration, instead of only finding out after Save fails server-side.
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, this.currentStoreName()).subscribe();
  }

  addItemToInvoice(): void {
    const carId = this.selectedCarId();
    if (!carId) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_SELECT_CAR');
      return;
    }
    const car = this.selectedCar();
    const quantity = this.selectedQuantity();
    const price = this.purchasePrice();

    if (!car || quantity <= 0 || price < 0) {
      return;
    }

    const existingItem = this.invoiceItems().find(item => item.carId === car.id);
    if (existingItem) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    const newItem: InvoiceItem = {
      carId: car.id,
      carDescription: buildVehicleDescription(car),
      quantity: quantity,
      unitPrice: price,
      lineTotal: price * quantity,
    };

    this.invoiceItems.update(items => [...items, newItem]);

    // Reset selection
    this.selectedCarId.set(null);
    this.selectedCar.set(null);
    this.selectedQuantity.set(1);
    this.purchasePrice.set(0);
  }

  removeItem = (e: any): void => {
    const carId = e.row.data.carId;
    this.invoiceItems.update(items => items.filter(item => item.carId !== carId));
  };

  /** Backs the line-item grid's Vehicle Details master-detail panel. cars() is InventoryService's
   * full, already-loaded inventory signal (the same source the car-picker dialog reads) -- no new
   * HTTP call needed since InvoiceItem itself only carries {carId, carDescription, ...}, not the
   * full Car record. */
  getCarForLine(carId: number): Car | undefined {
    return this.cars().find(c => c.id === carId);
  }

  /** DevExtreme's documented hook for deriving one column from an edit to another -- runs as part
   * of the edit itself (not a real "onCellValueChanged" grid event, which doesn't exist). Each
   * column keeps its own default assignment, then both recompute lineTotal the same way. */
  onQuantityCellValue = (newData: any, value: any, currentRowData: any): void => {
    newData.quantity = value;
    newData.lineTotal = value * (currentRowData.unitPrice ?? 0);
  };

  onUnitPriceCellValue = (newData: any, value: any, currentRowData: any): void => {
    newData.unitPrice = value;
    newData.lineTotal = (currentRowData.quantity ?? 0) * value;
  };

  /** Fires once the grid has committed a cell edit (lineTotal already recalculated by the
   * setCellValue hooks above). Just re-points invoiceItems at a new array reference so the
   * existing subtotal()/vatAmount()/totalAmount() computed signals recompute -- no calculation
   * is duplicated here. */
  onInvoiceItemRowUpdated = (): void => {
    this.invoiceItems.update(items => [...items]);
  };

  /**
   * Get the appropriate icon for the edit button based on batch tracking
   */
  getEditIcon = (e: any): string => {
    return e.row.data.trackByBatch ? 'inventory_2' : 'edit';
  };

  /**
   * Get the appropriate hint for the edit button based on batch tracking
   */
  getEditHint = (e: any): string => {
    return e.row.data.trackByBatch ? 'Allocate Batches' : 'Edit Quantity & VINs';
  };

  onCarSelectionChange(carId: number | null): void {
    this.selectedCarId.set(carId);
    if (carId) {
      this.inventoryService.getCarById(carId).subscribe(car => {
        this.purchasePrice.set(car?.purchasePrice ?? 0);
        this.selectedCar.set(car);
      });
    } else {
      this.purchasePrice.set(0);
      this.selectedCar.set(null);
    }
  }

  // Method for adding car from card selection
  addCarToPurchase(car: PurchaseCarSelectionCard): void {
    // Check if already exists
    const alreadyExists = this.invoiceItems().some(item => item.carId === car.id);
    if (alreadyExists) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    // Create invoice item with default quantity of 1
    const newItem: InvoiceItem = {
      carId: car.id,
      carDescription: buildVehicleDescription(car),
      quantity: 1,
      unitPrice: car.purchasePrice || 0,
      lineTotal: (car.purchasePrice || 0) * 1,
      trackByBatch: car.trackByBatch || false
    };

    // Add to invoice items
    this.invoiceItems.update(items => [...items, newItem]);
  }

  // =====================================================================
  // Mobile Details cards (shared-mobile-list) -- same invoiceItems() data,
  // add/edit/delete logic as the desktop dx-data-grid above; only the
  // rendering differs. Field config mirrors the dxi-column set 1:1 so the
  // two views never drift (same pattern established on sales-invoice-form).
  // =====================================================================
  protected readonly mobileDetailFields: MobileListFieldDto<InvoiceItem>[] = [
    { label: 'PURCHASE_INVOICE.RECEIVED_QTY', value: item => item.receivedQuantity, type: 'number', visible: () => this.hasGrnLineage() },
    { label: 'PURCHASE_INVOICE.QUANTITY', value: item => item.quantity, type: 'number' },
    { label: 'PURCHASE_INVOICE.UNIT_PRICE', value: item => item.unitPrice, type: 'currency' },
    { label: 'PURCHASE_INVOICE.TOTAL', value: item => item.lineTotal, type: 'currency' },
    {
      label: 'PURCHASE_INVOICE.EST_LANDED_COST',
      value: item => this.estimatedLandedCost(item),
      type: 'currency',
      visible: item => this.estimatedLandedCost(item) !== null,
    },
  ];

  protected readonly mobileDetailActions: MobileListActionDto<InvoiceItem>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'PURCHASE_INVOICE.EDIT_ITEM' },
    { id: 'delete', icon: 'delete', labelKey: 'PURCHASE_INVOICE.REMOVE_ITEM', cssClass: 'btn-danger' },
  ];

  mobileDetailTitleOf = (item: InvoiceItem): string => item.carDescription || '';

  mobileDetailTrackBy = (_index: number, item: InvoiceItem) => item.carId;

  onMobileDetailAction(event: { actionId: string; item: InvoiceItem }): void {
    if (event.actionId === 'edit') this.editQuantity({ row: { data: event.item } });
    else if (event.actionId === 'delete') this.removeItem({ row: { data: event.item } });
  }

  toggleCarCards(): void {
    const storeId = this.purchaseInvoiceForm.get('storeId')?.value;
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: { storeId },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCarToPurchase(result);
      }
    });
  }

  /**
   * Handle invoice type change
   */
  onInvoiceTypeChange(event: MatSelectChange): void {
    this.invoiceType.set(event.value);
  }

  /**
   * Handle invoice classification change
   */
  onInvoiceClassificationChange(event: MatSelectChange): void {
    const classification = this.invoiceClassifications().find(c => c.value === event.value);
    if (classification) {
      this.selectedInvoiceClassification.set(classification);
    }
  }

  // =====================================================================
  // Shared document UI integration (DocumentToolbar / DocumentTotals /
  // DocumentPrintService). Presentation-only: all calculations stay in the
  // existing computed signals and backend services.
  // =====================================================================

  /** Serialized form + items state used as the dirty-tracking baseline. */
  private documentSnapshot = '';

  private captureDocumentSnapshot(): void {
    this.documentSnapshot = this.serializeDocumentState();
  }

  private serializeDocumentState(): string {
    if (!this.purchaseInvoiceForm) return '';
    return JSON.stringify({
      form: this.purchaseInvoiceForm.getRawValue(),
      items: this.invoiceItems(),
      auctionCharges: this.auctionCharges()
    });
  }

  /** True when the user modified the document since the last load/save. Drives
   * the shared print workflow: clean documents print directly, dirty ones are
   * saved first so we never print stale server data. */
  isDocumentDirty(): boolean {
    if (!this.purchaseInvoiceForm) return false;
    return this.serializeDocumentState() !== this.documentSnapshot;
  }

  /** Same validity rule the save button always enforced, now feeding the shared action bar
   *  (called directly from the template, so it must stay protected/public, not private). */
  protected canSaveInvoice(): boolean {
    return !!this.purchaseInvoiceForm && !this.purchaseInvoiceForm.invalid && this.invoiceItems().length > 0;
  }

  // Action bar configuration moved into the template (app-action-bar inputs), replacing the
  // DocumentAction[]-driven DocumentToolbarComponent this screen used previously -- same
  // save/saveAndPrint/cancel behavior (no standalone Print action here, matching the
  // pre-existing toolbarActions() which never had one), now shared visually with Sales
  // Invoice/Sales Return/Purchase Return via AppActionBar.

  /** Shared cancel target for both the desktop toolbar's Cancel action and the mobile shell's
   * back/cancel (see shared-mobile-data-entry usage in the template). */
  cancelForm(): void {
    this.router.navigate([this.backRoute()]);
  }

  /**
   * Unified print workflow (DocumentPrintService):
   * - clean persisted document -> prints directly, no Save call;
   * - modified document -> saves, waits for the server-confirmed id, then prints;
   * - new document -> creates, receives the server-confirmed id, then prints it.
   */
  printInvoice(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.printWorkflow.printDocument({
      isPersisted: this.isEditMode(),
      isDirty: this.isDocumentDirty(),
      currentId: this.currentInvoiceId(),
      save: () => this.saveInvoiceCore(),
      print: id => this.printWorkflow.openPrintRoute(`/#/purchases/invoice/print/${id}`),
      onSettled: () => this.saving.set(false)
    });
  }

  /** Rows for the shared totals block -- same computed signals the summary rail always used. */
  totalsRows(): DocumentTotalsRow[] {
    const fmt = (v: number) => formatCurrency(v, this.localeId, 'SAR', 'symbol', '1.0-0');
    const rows: DocumentTotalsRow[] = [
      { labelKey: 'PURCHASE_INVOICE.SUBTOTAL', value: fmt(this.subtotal()) }
    ];

    if ((this.selectedInvoiceClassification()?.vatRate ?? 0) > 0) {
      rows.push({
        labelKey: 'PURCHASE_INVOICE.VAT',
        hint: `${this.selectedInvoiceClassification()?.vatRate}%`,
        value: '+ ' + fmt(this.vatAmount())
      });
    }

    if (this.hasMarginVatItems()) {
      rows.push({ labelKey: 'PURCHASE_INVOICE.MARGIN_VAT_NOTE', kind: 'muted', value: '' });
    }

    rows.push({ labelKey: 'PURCHASE_INVOICE.TOTAL', kind: 'total', value: fmt(this.totalAmount()) });

    // Payment breakdown order preserved from the previous summary rail:
    // Previously Paid -> Current Amount -> Amount Paid -> Amount Due -> Status.
    if (this.previousPayments() > 0) {
      rows.push({ labelKey: 'PURCHASE_INVOICE.PREVIOUS_PAYMENTS', value: fmt(this.previousPayments()) });
    }
    rows.push({ labelKey: 'PURCHASE_INVOICE.CURRENT_PAYMENT', value: fmt(this.currentPayment()) });
    rows.push({ labelKey: 'PURCHASE_INVOICE.AMOUNT_PAID', value: fmt(this.previewAmountPaid()) });
    rows.push({ labelKey: 'PURCHASE_INVOICE.AMOUNT_DUE', kind: 'total', value: fmt(this.previewAmountDue()) });
    rows.push({
      labelKey: 'PURCHASE_INVOICE.PAYMENT_STATUS',
      kind: 'muted',
      value: this.previewStatus() ? this.translate.instant(this.previewStatus()) : ''
    });

    return rows;
  }

  /** Save entry point -- keeps the exact previous behavior (stay on page, switch to edit mode). */
  saveInvoice(): void {
    this.saving.set(true);
    this.saveInvoiceCore().pipe(finalize(() => this.saving.set(false))).subscribe();
  }

  /**
   * The screen's single save pipeline. Returns the SERVER-CONFIRMED document id,
   * or null when validation/save failed. Both the Save button and the shared
   * save-before-print workflow funnel through here -- no duplicated save logic.
   */
  private saveInvoiceCore(): Observable<number | null> {
    if (this.purchaseInvoiceForm.invalid) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_INVALID_FORM');
      return of(null);
    }

    const formValue = this.purchaseInvoiceForm.getRawValue();
    const supplierId = formValue.supplierId;
    const supplier = this.suppliers().find(s => s.id === supplierId);
    const storeId = formValue.storeId;
    const items = this.invoiceItems();

    if (!supplierId || !supplier) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_SELECT_SUPPLIER'));
      return of(null);
    }
    // storeId used to come from CurrentSettingService.getStoreId(), which nothing in the app
    // ever set -- it always returned 0, so a "|| 1" fallback silently targeted store 1. Store
    // ids are per-tenant identity values behind a tenant query filter, so store 1 belongs to
    // whichever tenant owns it and is invisible to everyone else, making every other tenant's
    // Create fail with "Store with ID 1 not found". Now storeId comes from an explicit,
    // required field on this form, like every other invoice form in the app.
    if (!storeId) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_SELECT_STORE'));
      return of(null);
    }
    if (items.length === 0) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_NO_ITEMS'));
      return of(null);
    }
    if (this.totalAmount() <= 0) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_TOTAL_AMOUNT'));
      return of(null);
    }

    const newInvoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount' | 'creditAccountId'> = {
      invoiceNumber: this.invoiceNumberSignal() || '',
      invoiceDate: formValue.invoiceDate.toISOString(),
      storeId,
      supplierId: supplierId,
      // Optional client override of the Debit (Inventory/Expense) leg -- re-validated server-side
      // (exists, tenant-scoped, active, postable) and used verbatim when present; null (never
      // touched, or "Reset to Default" clicked back to a resolution the tracker couldn't confirm)
      // falls back to the existing derivation (PurchaseInvoiceService.ResolveDebitAccountAsync).
      // No creditAccountId sent: the Credit leg (Supplier AP or Cash/Bank) is this document's
      // system-resolved side and the backend always derives it via ResolveCreditAccountAsync.
      debitAccountId: formValue.debitAccountId ?? undefined,
      paymentType: formValue.paymentType,
      paymentMethod: formValue.paymentMethod,
      paymentMethodId: formValue.paymentMethodId ?? null,
      dueDate: formValue.dueDate ? formValue.dueDate.toISOString() : undefined,
      ClassificationId: parseInt(formValue.ClassificationId),
      invoiceType: formValue.invoiceType,
      items: items,
      // Pre-auction total (items + VAT) -- the backend adds AuctionCharges on top itself
      // (PurchaseInvoiceService.CreateAsync), so sending the already-inclusive totalAmount()
      // here would double-count the auction fees. Rounded to 2dp (currency precision), matching
      // the totalAmount computed signal above -- NOT Math.round(sum) to a whole riyal, which used
      // to silently save e.g. a real 13.80 total as 14.00.
      totalAmount: Math.round((this.subtotal() + this.vatAmount() + Number.EPSILON) * 100) / 100,
      // Cash invoices are auto-marked fully paid server-side; credit invoices net this off
      // against the total (Requirement 5's "Initial Payment"). Status is derived by the backend.
      initialPayment: this.isCashPayment() ? 0 : this.amountReceivedSignal(),
      notes: formValue.notes,
      status: 'Unpaid',
      isArchived: false,
      carReceiptIds: this.linkedReceiptIds(),
      // CASH only: the requested Cash/Bank settlement account. Undefined drops the field from
      // the JSON payload entirely on credit purchases -- supplier AP is derived server-side
      // there and a stale payment account must never ride along with a credit document.
      paymentAccountId: this.isCashPayment() ? (formValue.paymentAccountId ?? undefined) : undefined,
      // Auction fields are only meaningful when the toggle is checked -- otherwise this is a
      // normal supplier purchase and auctionProvider stays null, matching the backend's
      // IsAuctionPurchase(auctionProvider) check.
      auctionProvider: formValue.isAuctionPurchase ? formValue.auctionProvider : null,
      auctionLotNumber: formValue.isAuctionPurchase ? formValue.auctionLotNumber : null,
      auctionCharges: formValue.isAuctionPurchase ? this.auctionCharges() : []
    };

    // Credit purchases require the supplier's Accounts Payable account to already be resolvable
    // server-side -- check proactively so the user finds out (and can fix it inline via
    // "Link Account") before filling out the whole invoice, instead of only on a rejected save.
    // Cash purchases never need this: their credit leg is the payment account, not supplier AP.
    const partyCheck$ = this.isCashPayment()
      ? of(true)
      : warnIfPartyAccountMissing(this.dialog, this.supplierService.hasPayableAccount(supplierId), 'supplier', supplierId, supplier.name);

    return partyCheck$.pipe(
      switchMap(canProceed => {
        if (!canProceed) return of(null);

        if (this.isEditMode()) {
          const invoiceId = this.currentInvoiceId();
          if (!invoiceId) {
            this.notificationService.showError('PURCHASE_INVOICE.ERROR_INVALID_ID');
            return of(null);
          }
          return this.procurementService.updateInvoice(invoiceId, newInvoice).pipe(
            map(savedInvoice => {
              this.notificationService.showSuccess(this.translate.instant('TOAST.UPDATE_SUCCESS'));
              // Re-baseline dirty tracking so Print now sees a clean document.
              this.captureDocumentSnapshot();
              return invoiceId;
            }),
            catchError(error => {
              console.error('Error updating purchase invoice:', error);
              this.notificationService.showError(extractErrorMessage(error, this.translate, 'TOAST.SAVE_ERROR'));
              return of(null);
            })
          );
        }

        return this.procurementService.addInvoice(newInvoice).pipe(
          tap(savedInvoice => {
            this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
            // Switch into edit mode for the invoice just created -- without this, currentInvoiceId()
            // stays null after a fresh save, so the Additional Costs tab (which requires an existing
            // PurchaseInvoiceId, same as PurchaseAdditionalCost's backend FK) would stay disabled
            // forever in the same session instead of unlocking right after Save like it should.
            this.currentInvoiceId.set(savedInvoice.id);
            this.isEditMode.set(true);
          }),
          map(savedInvoice => {
            // Re-baseline dirty tracking so Print now sees a clean document.
            this.captureDocumentSnapshot();
            return savedInvoice.id;
          }),
          catchError(error => {
            console.error('Error saving purchase invoice:', error);
            this.notificationService.showError(extractErrorMessage(error, this.translate, 'TOAST.SAVE_ERROR'));
            return of(null);
          })
        );
      })
    );
  }

  editQuantity = (e: any): void => {
    const item = e.row.data;
    // Open VIN management dialog for non-batch items
    this.openVinManagementDialog(item);
  };

  /**
   * Open VIN management dialog for a specific item
   */
  private openVinManagementDialog(item: InvoiceItem): void {
    const dialogRef = this.dialog.open(VinManagementDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {
        item: {
          carDescription: item.carDescription,
          carId: item.carId
        },
        requiredQuantity: item.quantity,
      },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.vins) {
        // Update the item with the VIN numbers and quantity from totalRequired
        const vinNumbers = result.vins.map((v: VinEntry) => v.vin);
        const updatedQuantity = result.totalRequired ?? item.quantity;
        const updatedItem = { 
          ...item, 
          vinNumbers,
          quantity: updatedQuantity,
          lineTotal: item.unitPrice ? item.unitPrice * updatedQuantity : 0
        };
        this.updateInvoiceItem(updatedItem);
        this.notificationService.showSuccess(this.translate.instant('PURCHASE_INVOICE.VIN_UPDATED_SUCCESS'));
      }
    });
  }





  private updateInvoiceItem(updatedItem: InvoiceItem): void {
    const items = this.invoiceItems();
    const index = items.findIndex(item => item.carId === updatedItem.carId);
    if (index !== -1) {
      items[index] = updatedItem;
      this.invoiceItems.set([...items]);
    }
  }
}
