import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit, Input, LOCALE_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, ReactiveFormsModule, FormControl, ValidationErrors, Validators, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { DepositService } from '../../../services/deposit.service';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { Customer } from '../../../models/customer.model';
import { InvoiceClassificationOption } from '../../../models/invoice-classification.model';
import { Account } from '../../accounting/models';
import { DepositVoucher } from '../../../models/deposit-voucher.model';
import { CustomerOrder } from '../../../models/customer-order.model';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';
import { CarSelectionDialogComponent, SalesCarSelectionCard, SalesCarSelectionDialogData } from '../car-selection-dialog/car-selection-dialog.component';
import { CustomerLookupModalComponent } from '../../shared/customer-lookup-modal/customer-lookup-modal.component';
import { buildVehicleDescription } from '../../../models/vehicle-description';
import { applyFieldLock } from '../../../models/form-field-lock';
import { DxoValueErrorBarComponent } from 'devextreme-angular/ui/nested';
import { NotificationService } from '@/src/services/notification.service';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';
import { CashAmountCalculatorComponent } from '../../shared/cash-amount-calculator/cash-amount-calculator.component';
import { DiscountType } from '../../../models/sales-invoice-financials';
import { SalesInvoiceCalculationService } from '../../../services/sales-invoice-calculation.service';
import { Observable, of, map, tap, catchError, finalize, switchMap } from 'rxjs';
import { formatCurrency } from '@angular/common';
import { DocumentToolbarComponent, DocumentTotalsComponent, DocumentPrintService, DocumentAction, DocumentTotalsRow } from '../../shared/document';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { warnIfPartyAccountMissing } from '../../shared/party-account-required-dialog/party-account-required-warning.helper';
import { extractErrorMessage } from '../../../models/http-error-message';
import { StoreContextService } from '../../../services/store-context.service';
import { resolveStoreDisplayName } from '../../../models/store-display.util';

export enum InvoiceType {
  Taxable = 'Taxable',
  ZeroRated = 'Zero Rated',
  Exempt = 'Exempt'
}

/** Full pool of Payment Type instruments -- the single payment selector the user sees. Payment
 * Method (a separate backend/accounting field) is derived from whichever of these is picked; see
 * derivePaymentMethodFromType. */
const PAYMENT_TYPE_POOL: { value: string; labelKey: string }[] = [
  { value: 'Bank Transfer', labelKey: 'INVOICE.PAYMENT_BANK_TRANSFER' },
  { value: 'Check', labelKey: 'INVOICE.PAYMENT_CHECK' },
  { value: 'Cash', labelKey: 'INVOICE.PAYMENT_CASH' },
];

@Component({
  selector: 'app-sales-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatGridListModule,
    MatTableModule,
    MatDatepickerModule,
    MatDividerModule,
    MatTooltipModule,
    DxDataGridModule,
    TranslateModule,
    CashAmountCalculatorComponent,
    DocumentToolbarComponent,
    DocumentTotalsComponent,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-invoice-form.component.html',
  styleUrl: './sales-invoice-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceFormComponent implements OnInit {
    // Injected services -- declared first so field initializers further down the class (e.g.
    // cardLayout2 below) that read them run only after they're assigned.
    private inventoryService = inject(InventoryService);
    private customerService = inject(CustomerService);
    private salesCycleService = inject(SalesCycleService);
    private salesService = inject(SalesService);
    private currentSettingService = inject(CurrentSettingService);
    private accountingService = inject(AccountingService);
    private depositService = inject(DepositService);
    private router = inject(Router);
    private location = inject(Location);
    protected translate = inject(TranslateService);
    private dialog = inject(MatDialog);
    private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
    private storeContext = inject(StoreContextService);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private calc = inject(SalesInvoiceCalculationService);
    /** Shared save-before-print workflow + formatting locale for the shared totals block. */
    private printWorkflow = inject(DocumentPrintService);
    private localeId = inject(LOCALE_ID);

    @Input() customTitle: string | null = null;
  @Input() titleKey = 'INVOICE.CREATE_TITLE';
    /** Sales distribution channel (Afrad/Sharikat/Bunuk) â€” drives which fields are shown. */
    @Input() channel: SalesChannel = SalesChannel.Afrad;
    /** Cash / Credit / Installments â€” drives down-payment and payment-method behavior. */
    @Input() saleType: SaleType = SaleType.Cash;
    // Expose enums to template
    InvoiceType = InvoiceType;
    SalesChannel = SalesChannel;
    SaleType = SaleType;
    /** Derived from saleType for backward compatibility with the payload/edit-mode logic below. */
    get isCash(): boolean {
      return this.saleType === SaleType.Cash;
    }

  /**
   * Cash/Bank settlement accounts for CASH sales (debit leg: Dr Payment Account / Cr Revenue).
   * Loaded ONCE from the existing backend endpoint `accounts/postable?category=cash-bank`
   * (active + postable + Cash/Bank classified only) -- no client-side accounting
   * classification. The backend re-validates any selected id and falls back to its seeded
   * default Cash account when nothing is chosen.
   */
  paymentAccounts = signal<Account[]>([]);
  private paymentAccountsLoaded = false;

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  private paymentAccountTracker: DefaultAccountTracker | null = null;
  paymentAccountManuallyChanged = signal(false);

  /** Loads the Cash/Bank options exactly once per component instance. */
  private loadPaymentAccounts(): void {
    if (this.paymentAccountsLoaded) return;
    this.paymentAccountsLoaded = true;
    this.accountingService.getPostableAccounts('cash-bank').subscribe({
      next: accounts => this.paymentAccounts.set(accounts ?? []),
      error: () => this.paymentAccounts.set([])
    });
  }

  /** Keeps the Payment Account control in sync with the settlement type: required (and kept)
   * on CASH, cleared + optional on CREDIT/INSTALLMENT so a previously chosen cash account is
   * never sent with a credit document (Customer AR is server-resolved there). */
  /** Mixed Sale: a Credit/Installment invoice with a down payment posts two debit lines (Cash/Bank
   *  for the down payment + Customer AR for the remainder) -- see JournalEngineService.
   *  RegisterSaleJournalAsync. The Payment Account field is shown (optional -- the backend falls
   *  back to its default Cash account when left blank) whenever there's an actual down-payment
   *  leg to attach an account to. */
  hasDownPayment(): boolean {
    return !this.isCash && Number(this.invoiceForm?.get('downPayment')?.value) > 0;
  }

  /** "Reset to Default" action next to an overridden Payment Account field. */
  resetPaymentAccountToDefault(): void {
    this.paymentAccountTracker?.reset();
    this.paymentAccountManuallyChanged.set(false);
  }

  refreshPaymentAccountValidation(): void {
    const control = this.invoiceForm?.get('paymentAccountId');
    if (!control) return;

    if (!this.paymentAccountTracker) {
      this.paymentAccountTracker = new DefaultAccountTracker(this.accountingService, control as any);
      control.valueChanges.subscribe(() =>
        this.paymentAccountManuallyChanged.set(this.paymentAccountTracker!.manuallyChanged));
    }

    if (this.isCash) {
      // Fully cash: the payment account IS the invoice's whole debit leg -- required.
      control.setValidators([Validators.required]);
      control.updateValueAndValidity();
      this.paymentAccountTracker.recalculate({ kind: DefaultAccountKind.PaymentAccount });
    } else if (this.hasDownPayment()) {
      // Mixed sale: optional override of the down-payment leg's default Cash account.
      control.clearValidators();
      control.updateValueAndValidity();
      this.paymentAccountTracker.recalculate({ kind: DefaultAccountKind.PaymentAccount });
    } else {
      // Fully credit, nothing paid at creation: no cash leg exists at all.
      control.clearValidators();
      control.reset({ value: null, emitEvent: false });
      control.updateValueAndValidity();
    }
  }

  /**
   * Revenue account override (this document's only user-selectable account -- the Cash/Bank-or-
   * Customer-Receivable settlement side is an accounting implementation detail the backend always
   * resolves internally from Payment Method / Customer, and is never shown as a field).
   * Default-preselected via AccountResolutionService.resolve-default; the user can still pick a
   * different postable account. Entirely independent of the VAT, COGS/Inventory, and
   * Payment/Down-Payment-account lines above -- overriding it never touches those.
   */
  creditAccounts = signal<Account[]>([]);
  private creditAccountsLoaded = false;

  private creditAccountTracker: DefaultAccountTracker | null = null;
  creditAccountManuallyChanged = signal(false);

  private loadCreditAccounts(): void {
    if (this.creditAccountsLoaded) return;
    this.creditAccountsLoaded = true;
    this.accountingService.getPostableAccounts().subscribe({
      next: accounts => this.creditAccounts.set(accounts ?? []),
      error: () => this.creditAccounts.set([])
    });
  }

  resetCreditAccountToDefault(): void {
    this.creditAccountTracker?.reset();
    this.creditAccountManuallyChanged.set(false);
  }

  /** Re-derives the Credit-leg (Revenue) default -- car category revenue when the first invoiced
   *  car has one configured, else the company Sales Revenue account. */
  refreshCreditAccountDefault(): void {
    const control = this.invoiceForm?.get('creditAccountId');
    if (!control) return;
    if (!this.creditAccountTracker) {
      this.creditAccountTracker = new DefaultAccountTracker(this.accountingService, control as any);
      control.valueChanges.subscribe(() =>
        this.creditAccountManuallyChanged.set(this.creditAccountTracker!.manuallyChanged));
    }
    const firstCarId = this.invoiceItems()[0]?.carId ?? null;
    const category = firstCarId != null ? (this.cars() ?? []).find((c: any) => c.id === firstCarId)?.categoryId ?? null : null;
    this.creditAccountTracker.recalculate({ kind: DefaultAccountKind.SalesInvoiceCredit, partyId: category });
  }

  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'lineTotal', 'actions'];

 cardLayout2 = this.currentSettingService.getCardLayout(2);
  cardLayout3 = this.currentSettingService.getCardLayout(3);
  cardLayout4 = this.currentSettingService.getCardLayout(4);
  cardLayout5 = this.currentSettingService.getCardLayout(5);
  cardLayout6 = this.currentSettingService.getCardLayout(6);
  // Form controls
  invoiceForm!: FormGroup;
  // Services state
  customers = this.customerService.customers$;
  /** Read-only label for the (no-longer-user-editable) Store field -- resolves the form's storeId
   *  against every store the caller is authorized for, so an edit-mode document keeps showing its
   *  real, originally-saved store name even if that store isn't the caller's current one. */
  currentStoreName = computed(() => resolveStoreDisplayName(
    this.storeContext.memberships(),
    this.invoiceForm?.get('storeId')?.value ?? null,
    this.storeContext.current()?.nameAr,
  ));
  private allCars = signal([
    { id: 1, make: 'Toyota', model: 'Corolla', year: 2022, status: 'Available', condition: 'New', salePrice: 50000, totalCost: 40000, photos: ['https://picsum.photos/seed/toyota/800/600'] },
  ]);
  carQuantities = signal(new Map([[1, 5], [2, 3]])); // Mock quantities
  carStocks = signal<StoreCarStockDto[]>([]);
  availableCars = signal<StoreCarStockDto[]>([]);

  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);
  /** Source of unique `lineKey` values for the grid (see InvoiceItem.lineKey) -- monotonically
   * increasing per form instance, never reused, never sent to the backend. */
  private nextLineKey = 1;
  private allocateLineKey(): number {
    return this.nextLineKey++;
  }

  invoiceNumber = signal('');
  isEditMode = signal(false);
  currentInvoiceId = signal<number | null>(null);
  /** True while a save / save-and-print round-trip is in flight (drives the shared toolbar's busy state). */
  saving = signal(false);
  selectedCustomer = signal<Customer | null>(null);

  // Invoice type signal
  invoiceType = signal<InvoiceType>(InvoiceType.Taxable);

  // Invoice classification signals
  invoiceClassifications = signal<InvoiceClassificationOption[]>([]);
  selectedInvoiceClassification = signal<InvoiceClassificationOption | null>(null);

  // Deposit signals
  selectedDeposit = signal<DepositVoucher | null>(null);
  depositAmount = signal(0);
  // Bank Sales orders carry a bankId not modeled on the base CustomerOrder type.
  selectedCustomerOrder = signal<(CustomerOrder & { bankId?: number }) | null>(null);

  // Discount + VAT rate signals (mirror the discountType/discountValue/invoiceType form controls
  // so the financial-breakdown computed signals below can react to them).
  discountTypeSignal = signal<DiscountType>('Fixed');
  discountValueSignal = signal(0);
  invoiceTypeSignal = signal<InvoiceType>(InvoiceType.Taxable);
  /** Mirrors the downPayment control purely for display in the "Down Payment" summary row. */
  downPaymentSignal = signal(0);
  /** Snapshot of amountPaid as loaded when entering edit mode -- represents money already
   * collected for this invoice prior to this editing session (see previousPayments below). */
  originalAmountPaid = signal(0);

  /** Payment Method is no longer a user-facing field -- Payment Type is now the single control
   * the user picks from, and Payment Method (still required by the backend/accounting) is derived
   * from it automatically (see watchPaymentTypeControl). */
  paymentTypeOptions = computed(() => PAYMENT_TYPE_POOL);

  // Traceability: Parent Quotation lineage state
  activeQuotations = signal<Quotation[]>([]);
  selectedQuotationId = signal<number | null>(null);
  linkedQuotation = signal<Quotation | null>(null);
  hasQuotationLineage = computed(() => !!this.linkedQuotation());
  hasOrderLineage = computed(() => !!this.selectedCustomerOrder());

  constructor() {
    // Left blank on create -- the server generates the real number (DocumentNumberingSetting for
    // the applicable INV-RTL/INV-CORP/INV-BANK type), or accepts a manually-typed one if that
    // document type has automatic numbering disabled. See purchase-invoice.component.ts for the
    // same pattern.

    // Keeps the discountValue control's "exceeds subtotal" validity fresh as items or the
    // discount type change -- Validators.pattern-style static validators can't see live signal
    // state on their own, so this effect re-triggers validation whenever the inputs it depends on
    // change (e.g. removing a line no longer covered by a fixed discount surfaces the error
    // immediately instead of only on the next keystroke in the discount field).
    effect(() => {
      this.subtotal();
      this.discountTypeSignal();
      this.invoiceForm?.get('discountValue')?.updateValueAndValidity({ emitEvent: false });
    });

    // Credit-account (Revenue) default depends on the first invoiced car's category -- re-preview
    // whenever the line items change (add/remove/edit), same reactive-effect pattern as above.
    effect(() => {
      this.invoiceItems();
      this.cars();
      if (this.invoiceForm) {
        this.refreshCreditAccountDefault();
      }
    });
  }

  ngOnInit() {
    // Check if we're editing an existing invoice
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.isEditMode.set(true);
      this.currentInvoiceId.set(+invoiceId);
      this.loadInvoiceForEdit(+invoiceId);
    } else {
      // Initialize form group for new invoice
      this.invoiceForm = new FormGroup({
        // No Store picker anymore -- a new invoice always belongs to the caller's current
        // Showroom (StoreContextService), selected once after login.
        storeId: new FormControl(this.storeContext.current()?.storeId ?? null, Validators.required),
        customer: new FormControl(null, Validators.required),
        invoiceDate: new FormControl(new Date(), Validators.required),
        dueDate: new FormControl(''),
        paymentMethod: new FormControl('Cash'),
        paymentType: new FormControl(this.saleType === SaleType.Cash ? 'Cash' : 'Bank Transfer'),
        invoiceType: new FormControl(InvoiceType.Taxable, Validators.required),
        ClassificationId: new FormControl(0, Validators.required),
        salesperson: new FormControl(''),
        selectedCarId: new FormControl(null),
        selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
        notes: new FormControl(''),
        selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
        downPayment: new FormControl(0),
        // Cash/Bank settlement account (CASH sales only -- see the model doc). The backend
        // falls back to the tenant's seeded default Cash when this is omitted.
        paymentAccountId: new FormControl<number | null>(null),
        // Credit (Revenue) account override -- default-preselected via DefaultAccountTracker (see
        // refreshCreditAccountDefault below), user-editable, and re-validated server-side on save.
        // No debitAccountId control: the Debit leg (Cash/Bank or Customer AR) is this document's
        // system-resolved side and is never accepted from this form.
        creditAccountId: new FormControl<number | null>(null),
        discountType: new FormControl<DiscountType>('Fixed'),
        discountValue: new FormControl(0, [Validators.min(0), this.discountExceedsSubtotalValidator])
      });
      this.updateDownPaymentValidators();
      this.loadPaymentAccounts();
      this.refreshPaymentAccountValidation();
      this.watchAmountReceivedControls();
      this.watchDiscountControls();
      this.watchClassificationAndTypeControls();
      this.watchPaymentTypeControl();
      this.applyPaymentTypeLock();
      this.loadCreditAccounts();
      this.refreshCreditAccountDefault();

      // Heads-up only: warns immediately if the current Showroom has no active
      // StoreAccountingConfiguration, instead of only finding out after Save fails server-side.
      const initialStoreId = this.invoiceForm.get('storeId')?.value;
      if (initialStoreId) {
        this.warnIfCurrentStoreNotConfigured(initialStoreId);
      }

      // Deep-link from a preceding Sales Order step (Corporate/Bank workflows)
      const orderId = this.route.snapshot.queryParamMap.get('orderId');
      if (orderId) {
        this.loadLinkedOrder(+orderId);
      }
    }

    // Load invoice classifications from API
    this.currentSettingService.getInvoiceClassifications().subscribe(classifications => {
      this.invoiceClassifications.set(classifications);
      // Set default classification if available
      if (classifications.length > 0) {
        this.selectedInvoiceClassification.set(classifications[0]);
        // Update form with default classification
        this.invoiceForm?.patchValue({
          ClassificationId: classifications[0].value
        });
      }
      // Baseline the dirty-tracking snapshot once async defaulting has settled
      // (see captureDocumentSnapshot) so Print won't save an untouched document.
      this.captureDocumentSnapshot();
    });

    // Load active quotations for the traceability bar's Parent Quotation dropdown
    this.loadActiveQuotations();

    // Watch for customer changes to check for pending orders
    // (paymentMethod is no longer set here -- it's derived from paymentType, see watchPaymentTypeControl)
    this.invoiceForm.get('customer')?.valueChanges.subscribe(customerId => {
      const customer = this.customers().find(c => c.id === customerId);
      this.selectedCustomer.set(customer || null);

      // Check for pending orders
      if (customerId) {
        this.checkPendingOrders(customerId);
      }
    });
  }

  /** Required/cleared to match SaleTypeSelectorComponent's validator behavior. */
  private updateDownPaymentValidators(): void {
    const control = this.invoiceForm.get('downPayment');
    if (!control) {
      return;
    }
    if (this.saleType === SaleType.Credit || this.saleType === SaleType.Installments) {
      control.setValidators([Validators.required, Validators.min(0)]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity();

    // Same trigger drives the Payment Account requirement (CASH only) so a Cash -> Credit
    // switch clears any previously chosen account before it can reach the payload.
    this.refreshPaymentAccountValidation();
  }

  /** Keeps amountReceivedSignal (used by the live Paid/Due/Status preview) in sync with the
   * downPayment form control for credit/installment sales. Cash sales always show the full total. */
  private watchAmountReceivedControls(): void {
    this.invoiceForm.get('downPayment')?.valueChanges.subscribe((value: number) => {
      if (!this.isCash) {
        this.amountReceivedSignal.set(Number(value) || 0);
      }
      // Mixed Sale: entering/clearing a down payment shows/hides the (optional) Payment Account
      // field for its cash leg.
      this.refreshPaymentAccountValidation();
    });
    if (!this.isCash) {
      this.amountReceivedSignal.set(Number(this.invoiceForm.get('downPayment')?.value) || 0);
    }
    this.downPaymentSignal.set(Number(this.invoiceForm.get('downPayment')?.value) || 0);
    this.invoiceForm.get('downPayment')?.valueChanges.subscribe((value: number) => {
      this.downPaymentSignal.set(Number(value) || 0);
    });
  }

  /** A Percentage discount can't exceed 100%; a Fixed discount can't exceed the current subtotal.
   * Declared as a bound arrow field (not a method) so Angular can call it directly as a
   * ValidatorFn while it still reads live `this` state (current subtotal/discount type). */
  private discountExceedsSubtotalValidator = (control: AbstractControl): ValidationErrors | null => {
    const discountType = this.invoiceForm?.get('discountType')?.value as DiscountType;
    const valid = this.calc.isDiscountValid(this.subtotal(), discountType, Number(control.value) || 0);
    return valid ? null : { discountExceedsSubtotal: true };
  };

  /** Keeps discountAmount/amountAfterDiscount in sync with the discount type/value form controls. */
  private watchDiscountControls(): void {
    this.discountTypeSignal.set((this.invoiceForm.get('discountType')?.value as DiscountType) || 'Fixed');
    this.discountValueSignal.set(Number(this.invoiceForm.get('discountValue')?.value) || 0);
    this.invoiceForm.get('discountType')?.valueChanges.subscribe((value: DiscountType) => {
      this.discountTypeSignal.set(value || 'Fixed');
    });
    this.invoiceForm.get('discountValue')?.valueChanges.subscribe((value: number) => {
      this.discountValueSignal.set(Number(value) || 0);
    });
  }

  /** Payment Method has no UI of its own anymore -- Payment Type is the only field the user
   * touches, and Payment Method (still required server-side/for accounting) is derived from it
   * automatically. Bank-financed (Bunuk channel) sales always report "Finance" regardless of the
   * selected type, matching the previous customer-driven default for that channel. */
  private derivePaymentMethodFromType(paymentType: string): string {
    if (this.channel === SalesChannel.Bunuk) return 'Finance';
    return paymentType === 'Cash' ? 'Cash' : (paymentType || 'Bank Transfer');
  }

  private watchPaymentTypeControl(): void {
    const typeControl = this.invoiceForm.get('paymentType');
    const methodControl = this.invoiceForm.get('paymentMethod');
    if (!typeControl || !methodControl) return;

    const applyPaymentType = (value: string) => {
      methodControl.setValue(this.derivePaymentMethodFromType(value), { emitEvent: false });
    };

    applyPaymentType(typeControl.value);
    typeControl.valueChanges.subscribe(applyPaymentType);
  }

  /** Cash invoices only ever have one valid Payment Type ("Cash") -- lock and disable the
   * control so it can't be changed. Credit/Installments have no single fixed instrument (the
   * pool is Bank Transfer/Check/Cash, none of which applies until the credit is actually repaid),
   * so the field is left enabled here and hidden entirely in the template instead of locked to an
   * arbitrary value -- matches Purchase's "no markup at all" treatment for the same situation. */
  private applyPaymentTypeLock(): void {
    const control = this.invoiceForm.get('paymentType');
    if (this.saleType === SaleType.Cash) {
      applyFieldLock(control, { value: 'Cash', disable: true });
    } else {
      applyFieldLock(control, null);
    }
  }

  /** Keeps vatRate reactive to both the invoice-classification dropdown (authoritative VAT rate)
   * and the Taxable/Zero-Rated/Exempt selector (fallback when no classification vatRate is set). */
  private watchClassificationAndTypeControls(): void {
    this.invoiceTypeSignal.set((this.invoiceForm.get('invoiceType')?.value as InvoiceType) || InvoiceType.Taxable);
    this.invoiceForm.get('invoiceType')?.valueChanges.subscribe((value: InvoiceType) => {
      this.invoiceTypeSignal.set(value || InvoiceType.Taxable);
    });
    this.invoiceForm.get('ClassificationId')?.valueChanges.subscribe((id: number) => {
      const found = this.invoiceClassifications().find(c => c.value === id);
      this.selectedInvoiceClassification.set(found || null);
    });
  }

  /** Prefills the invoice from a Sales Order created in a preceding workflow step (Corporate/Bank). */
  loadLinkedOrder(orderId: number): void {
    this.salesService.getCustomerOrderById(orderId).subscribe({
      next: (order) => {
        this.selectedCustomerOrder.set(order);
        this.invoiceForm.patchValue({
          customer: order.customerId,
          storeId: order.storeId || null
        });
        if (order.vehicleId) {
          this.addCarToInvoiceById(order.vehicleId);
        }
      },
      error: (err) => console.error('Failed to load linked order', err)
    });
  }

  /** Un-invoiced quotations -- the eligible dropdown source for the traceability bar. */
  loadActiveQuotations(): void {
    this.salesCycleService.getQuotations().subscribe({
      next: (quotations) => this.activeQuotations.set((quotations || []).filter(q => q.status !== 'Invoiced')),
      error: (err) => {
        console.error('Error loading active quotations', err);
        this.activeQuotations.set([]);
      }
    });
  }

  onQuotationSelected(quotationId: number | null): void {
    this.selectedQuotationId.set(quotationId);
    if (!quotationId) {
      return;
    }

    const quotation = this.activeQuotations().find(q => q.id === quotationId);
    if (!quotation) {
      return;
    }

    this.linkedQuotation.set(quotation);

    // Inherit and lock the customer from the quotation -- the invoice is financially tied to it.
    this.invoiceForm.patchValue({ customer: quotation.customerId });
    this.invoiceForm.get('customer')?.disable();

    const items: InvoiceItem[] = (quotation.items || []).map(line => ({
      lineKey: this.allocateLineKey(),
      carId: line.carId,
      carDescription: line.carDescription,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      salesPrice: line.unitPrice,
      lineTotal: line.lineTotal
    }));
    this.invoiceItems.set(items);

    this.notificationService.showSuccess(this.translate.instant('INVOICE.QUOTATION_APPLIED'));
  }

  loadInvoiceForEdit(invoiceId: number) {
    this.salesService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Restore channel/saleType from the saved invoice (fall back to legacy isCash/paymentMethod)
        if (invoice.salesChannel !== undefined) {
          this.channel = invoice.salesChannel;
        }
        if (invoice.saleType) {
          this.saleType = invoice.saleType;
        } else {
          this.saleType = (invoice.isCash ?? invoice.paymentMethod === 'Cash') ? SaleType.Cash : SaleType.Credit;
        }

        // Initialize form group with existing invoice data
        this.invoiceForm = new FormGroup({
          storeId: new FormControl(invoice.storeId, Validators.required),
          customer: new FormControl(invoice.customerId, Validators.required),
          invoiceDate: new FormControl(new Date(invoice.invoiceDate), Validators.required),
          dueDate: new FormControl(invoice.dueDate ? new Date(invoice.dueDate) : ''),
          paymentMethod: new FormControl(invoice.paymentMethod || 'Cash'),
          paymentType: new FormControl(invoice.paymentType || 'Bank Transfer'),
          salesperson: new FormControl(invoice.salesperson || ''),
          ClassificationId: new FormControl(invoice.ClassificationId || 0, Validators.required),
          invoiceType: new FormControl(invoice.invoiceType || InvoiceType.Taxable, Validators.required),
          selectedCarId: new FormControl(null),
          selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
          notes: new FormControl(invoice.notes || ''),
          selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
          downPayment: new FormControl(invoice.downPayment || 0),
          // Cash invoices persist their payment account in CreditAccountId server-side
          // (the cash entry's debit leg) -- preselect it so edit mode shows the stored one.
          // Credit/Installment invoices with a down payment (Mixed Sale) persist theirs in
          // DownPaymentAccountId instead -- same idea, different backend field.
          paymentAccountId: new FormControl<number | null>(
            (invoice.saleType ?? (invoice.isCash ? SaleType.Cash : SaleType.Credit)) === SaleType.Cash
              ? (invoice.creditAccountId ?? null)
              : (invoice.downPaymentAccountId ?? null)
          ),
          // Preselect with the invoice's own STORED Credit account -- never silently recomputed
          // on load (Requirement 3). See the tracker markAsManuallyChanged() call below for why
          // the control must be told this is already a real saved value. No debitAccountId
          // control -- see the earlier comment; invoice.debitAccountId (already resolved by the
          // backend) is only used read-only, e.g. on the printable invoice.
          creditAccountId: new FormControl<number | null>(invoice.creditAccountId ?? null),
          discountType: new FormControl<DiscountType>(invoice.discountType || 'Fixed'),
          discountValue: new FormControl(invoice.discountValue || 0, [Validators.min(0), this.discountExceedsSubtotalValidator])
        });
        // Construct the Payment Account tracker BEFORE any recalculate() call can fire (from
        // updateDownPaymentValidators -> refreshPaymentAccountValidation below), and -- since the
        // control's initial value was set via the FormControl(...) constructor above rather than
        // a later patchValue/setValue the tracker would see as a "manual change" -- explicitly
        // mark it manual right now if a saved account is already present. Otherwise a loaded
        // invoice's real saved account could be silently overwritten by a freshly resolved default.
        const paymentAccountControl = this.invoiceForm.get('paymentAccountId') as any;
        this.paymentAccountTracker = new DefaultAccountTracker(this.accountingService, paymentAccountControl);
        if (paymentAccountControl.value != null) {
          this.paymentAccountTracker.markAsManuallyChanged();
        }
        this.paymentAccountManuallyChanged.set(this.paymentAccountTracker.manuallyChanged);
        paymentAccountControl.valueChanges.subscribe(() =>
          this.paymentAccountManuallyChanged.set(this.paymentAccountTracker!.manuallyChanged));

        // Same construct-before-recalculate + explicit markAsManuallyChanged() fix as the Payment
        // Account tracker above, applied to the Credit override field.
        const creditAccountControl = this.invoiceForm.get('creditAccountId') as any;
        this.creditAccountTracker = new DefaultAccountTracker(this.accountingService, creditAccountControl);
        if (creditAccountControl.value != null) {
          this.creditAccountTracker.markAsManuallyChanged();
        }
        this.creditAccountManuallyChanged.set(this.creditAccountTracker.manuallyChanged);
        creditAccountControl.valueChanges.subscribe(() =>
          this.creditAccountManuallyChanged.set(this.creditAccountTracker!.manuallyChanged));
        this.loadCreditAccounts();

        this.updateDownPaymentValidators();
        this.loadPaymentAccounts();
        this.amountReceivedSignal.set(invoice.isCash ? invoice.totalAmount : (invoice.downPayment || invoice.amountPaid || 0));
        this.originalAmountPaid.set(invoice.amountPaid || 0);
        this.watchAmountReceivedControls();
        this.watchDiscountControls();
        this.watchClassificationAndTypeControls();
        this.watchPaymentTypeControl();
        // Applied after saleType is reassigned above from the saved invoice (not just the
        // wrapper's @Input()), so a Cash invoice opened for edit is locked using its real,
        // persisted classification even if that differs from whatever route/wrapper was used.
        this.applyPaymentTypeLock();
        if (invoice.storeId) {
          this.warnIfCurrentStoreNotConfigured(invoice.storeId);
        }

        // Set invoice number and items
        this.invoiceNumber.set(invoice.invoiceNumber);
        // Backend-loaded items don't carry a lineKey -- assign one so the grid's row identity is
        // unique even when a prep-charge line shares its carId with the vehicle line it belongs to.
        this.invoiceItems.set((invoice.items || []).map(item => ({ ...item, lineKey: this.allocateLineKey() })));
        // Baseline the dirty-tracking snapshot for the freshly loaded document.
        this.captureDocumentSnapshot();
      },
      error: (error) => {
        console.error('Failed to load invoice for edit', error);
        // Navigate back to sales list on error
        this.router.navigate(['/sales']);
      }
    });
  }

  checkPendingOrders(customerId: number): void {
    this.salesService.getPendingCustomerOrders(customerId).subscribe({
      next: (orders) => {
        if (orders.length > 0) {
          const order = orders[0]; // Take the first pending order
          this.selectedCustomerOrder.set(order);
          // Auto-fill fields
          this.invoiceForm.patchValue({
            selectedCarId: order.vehicleId,
            salesperson: order.salesperson || '',
            storeId: order.storeId || null
          });
          // Optionally, add the vehicle to invoice items
          this.addCarToInvoiceById(order.vehicleId);
        }
      },
      error: (error) => {
        console.error('Failed to check pending orders', error);
      }
    });
  }

  addCarToInvoiceById(vehicleId: number): void {
    // allCars is placeholder/mock inventory data (unrelated to the real StoreCarStockDto-backed
    // available-cars flow) -- normalize its shape into StoreCarStockDto so addCarToInvoice has a
    // single real contract instead of accepting two unrelated shapes.
    const car = this.allCars().find(c => c.id === vehicleId);
    if (car) {
      this.addCarToInvoice({
        id: car.id,
        storeId: 0,
        storeName: '',
        carId: car.id,
        carName: buildVehicleDescription({ make: car.make, model: car.model, year: car.year }),
        carDescription: '',
        availableQuantity: 1,
        quantity: 1,
        reservedQuantity: 0,
        lastUpdatedAt: '',
        salesPrice: car.salePrice,
        make: car.make,
        model: car.model,
        year: car.year,
      });
    }
  }

  /** Heads-up only: warns the user immediately if the invoice's Store has no active
   * StoreAccountingConfiguration, instead of only finding out after Save fails server-side. Called
   * once the storeId is known (current Showroom for a new invoice, saved value for an edit) --
   * there's no more Store dropdown to hang a (selectionChange) handler off of. */
  private warnIfCurrentStoreNotConfigured(storeId: number | null): void {
    const storeName = this.currentStoreName();
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, storeName).subscribe();
  }

  loadCarStocks(storeId: number) {
    this.salesService.getStocksByStore(storeId).subscribe({
      next: (stocks) => {
        this.carStocks.set(stocks);
        console.log('Car stocks loaded for store', storeId, stocks);
      },
      error: (error) => {
        console.error('Failed to load car stocks', error);
        this.carStocks.set([]);
      }
    });

    // Load available cars
    this.salesService.getAvailableCarsByStore(storeId).subscribe({
      next: (availableStocks) => {
        console.log('Available cars loaded for store', storeId, availableStocks);
        this.availableCars.set(availableStocks);
        this.invoiceForm.get('selectedCarId')?.setValue(null);
      },
      error: (error) => {
        console.error('Failed to load available cars', error);
        this.availableCars.set([]);
      }
    });
  }

  toggleCarCards(): void {
    const storeId = this.invoiceForm.get('storeId')?.value;
    const dialogRef = this.dialog.open<CarSelectionDialogComponent, SalesCarSelectionDialogData, SalesCarSelectionCard | undefined>(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {
        storeId: storeId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addCarToSales(result);
      }
    });
  }

  addCarToSales(car: SalesCarSelectionCard): void {
    // Check if already exists
    const alreadyExists = this.invoiceItems().some(item => item.carId === car.carId);
    if (alreadyExists) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    // Create invoice item with default quantity of 1
    const newItem: InvoiceItem = {
      lineKey: this.allocateLineKey(),
      carId: car.carId,
      carDescription: buildVehicleDescription(car) || car.carDescription || car.carName,
      quantity: 1,
      salesPrice: car.salesPrice || 0,
      lineTotal: this.calc.calculateLineTotal(1, car.salesPrice || 0),
    };

    // Add to invoice items
    this.invoiceItems.update(items => [...items, newItem]);

    // Load and add preparation charges for this vehicle
    this.loadPreparationCharges(car.id);
  }

  // ---- Financial breakdown computed signals --------------------------------------------------
  // All formulas are delegated to SalesInvoiceCalculationService (backed by
  // sales-invoice-financials.ts) so the create/edit form and the printable invoice (which
  // recomputes from the saved record) can never show inconsistent figures, and no calculation is
  // ever written out twice.

  /** Full Car pool (including calculateVATFromProfitMargin/totalCost), for the per-line VAT
   * preview below -- same source purchase-invoice.component.ts already uses for its own
   * hasMarginVatItems check. */
  cars = this.inventoryService.cars$;

  /** VAT rate (0 or 15) -- the selected classification's own rate wins; falls back to the
   * Taxable/Zero-Rated/Exempt selector when no classification is set. */
  vatRate = computed(() => this.calc.resolveVatRate(this.selectedInvoiceClassification()?.vatRate, this.invoiceTypeSignal()));

  /** Per-line VAT preview: profit-margin-scheme cars are computed via calculateLineVat (VAT on
   * margin above the car's landed cost, gross-fixed-price basis); every other line keeps the
   * existing net-plus-VAT-on-top convention. Preview only -- the backend recomputes and persists
   * the authoritative Subtotal/VATAmount on save. */
  lineVatBreakdown = computed(() => {
    const carsList = this.cars() ?? [];
    const rate = this.vatRate();
    return this.invoiceItems().map(item => {
      const car = carsList.find((c: any) => c.id === item.carId);
      if (car?.calculateVATFromProfitMargin) {
        return this.calc.calculateLineVat({
          grossAmount: item.lineTotal,
          useMarginScheme: true,
          priorCost: (car.totalCost ?? 0) * item.quantity,
          vatRatePercent: rate,
        });
      }
      const vatAmount = this.calc.calculateVatAmount(item.lineTotal, rate);
      return { subtotal: item.lineTotal, vatAmount, totalAmount: item.lineTotal + vatAmount, marginWasNonPositive: false };
    });
  });

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

  /** Subtotal before discount -- sum of each line's VAT-exclusive preview amount (standard or
   * margin-scheme). */
  subtotal = computed(() => this.lineVatBreakdown().reduce((sum, r) => sum + r.subtotal, 0));

  private grossVatTotal = computed(() => this.lineVatBreakdown().reduce((sum, r) => sum + r.vatAmount, 0));

  discountAmount = computed(() => this.calc.calculateDiscountAmount(this.subtotal(), this.discountTypeSignal(), this.discountValueSignal()));

  amountAfterDiscount = computed(() => Math.max(0, this.subtotal() - this.discountAmount()));

  /** Scales the blended per-line VAT proportionally by the discount, keeping the effective
   * average rate constant before/after discount -- mirrors the backend's
   * SalesInvoiceService.CalculateAmountsAsync so preview and saved totals stay aligned. */
  vatAmount = computed(() => {
    const sub = this.subtotal();
    if (sub <= 0) return 0;
    return Math.round((this.grossVatTotal() * (this.amountAfterDiscount() / sub) + Number.EPSILON) * 100) / 100;
  });

  totalAmount = computed(() => Math.round((this.amountAfterDiscount() + this.vatAmount() + Number.EPSILON) * 100) / 100);

  hasInstallments = computed(() => {
    return this.invoiceItems().some(item => item.installmentDetails);
  });

  /** Amount received from the cash calculator (cash sales) or the down-payment field (credit sales). */
  amountReceivedSignal = signal(0);

  /** Money already collected before this save (a deposit paid on the vehicle, plus -- in edit
   * mode -- whatever was already recorded as paid on the invoice being edited). */
  previousPayments = computed(() => this.depositAmount() + (this.isEditMode() ? this.originalAmountPaid() : 0));

  /** Money being captured in this exact transaction: the full total for cash sales (assumed
   * fully paid at sale time), or the down payment entered for credit/installment sales. */
  currentPayment = computed(() => this.isCash ? this.totalAmount() : Math.max(0, this.amountReceivedSignal()));

  /** Live preview of AmountPaid/AmountDue/Status - mirrors InvoicePaymentCalculator.Recalculate on the backend. */
  previewAmountPaid = computed(() => Math.min(this.totalAmount(), this.previousPayments() + this.currentPayment()));

  previewAmountDue = computed(() => Math.max(0, this.totalAmount() - this.previewAmountPaid()));

  /** Alias of previewAmountDue for the "Remaining Balance" summary row. */
  remainingBalance = computed(() => this.previewAmountDue());

  previewStatus = computed(() => {
    if (this.totalAmount() > 0 && this.previewAmountDue() <= 0) return 'INVOICE.STATUS_PAID';
    return 'INVOICE.STATUS_PENDING';
  });

  onAmountReceivedChange(value: number): void {
    this.amountReceivedSignal.set(value || 0);
  }

  // Computed property for car cards display
  carCards = computed(() => {
    return this.availableCars().map(car => ({
      ...car,
      imageUrl: 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(car.carName), // Placeholder image with car name
      carName: car.carName,
      specs: car.carDescription || buildVehicleDescription(car) || 'No description available',
      availableQuantity: car.availableQuantity
    }));
  });

  // Methods for managing invoice items
  addCarToInvoice(car: StoreCarStockDto): void {
    const description = buildVehicleDescription(car);
    const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
      width: '400px',
      data: {
        carName: description,
        quantity: 1,
        unitPrice: car.salesPrice || 0,
        maxQuantity: car.availableQuantity
      },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        const { quantity, unitPrice } = result;

        // Check if already exists
        const alreadyExists = this.invoiceItems().some(item => item.carId === car.carId);
        if (alreadyExists) {
          this.notificationService.showError('INVOICE.ALREADY_ADDED');
          return;
        }

        // Check quantity
        if (quantity > car.availableQuantity) {
          this.notificationService.showError('INVOICE.INSUFFICIENT_STOCK');
          return;
        }

        // Create invoice item
        const newItem: InvoiceItem = {
          lineKey: this.allocateLineKey(),
          carId: car.carId,
          carName: car.carName,
          carDescription: description,
          quantity,
          unitPrice,
          salesPrice: unitPrice,
          lineTotal: this.calc.calculateLineTotal(quantity, unitPrice),
        };

        // Add to invoice items
        this.invoiceItems.update(items => [...items, newItem]);

        // Load and add preparation charges for this vehicle
        this.loadPreparationCharges(car.carId);

        // Check for deposits for this vehicle
        this.checkForDeposit(car.carId);
      }
    });
  }

  checkForDeposit(vehicleId: number): void {
    // Assuming depositService has a method to get deposits by vehicleId
    this.depositService.getDepositsByVehicle(vehicleId).subscribe({
      next: (deposits) => {
        if (deposits.length > 0) {
          const deposit = deposits[0]; // Take the first deposit
          this.selectedDeposit.set(deposit);
          this.depositAmount.set(deposit.amount);
        }
      },
      error: (error) => {
        console.error('Failed to check for deposits', error);
      }
    });
  }

  loadPreparationCharges(vehicleId: number): void {
    this.salesService.getPreparationChargesByVehicle(vehicleId).subscribe({
      next: (charges) => {
        const pendingCharges = charges.filter(charge => charge.status === 'Pending');
        pendingCharges.forEach(charge => {
          const chargeItem: InvoiceItem = {
            lineKey: this.allocateLineKey(),
            carId: vehicleId,
            carDescription: `Preparation: ${charge.itemName}`,
            quantity: 1,
            unitPrice: charge.price,
            salesPrice: charge.price,
            lineTotal: this.calc.calculateLineTotal(1, charge.price),
            isPreparationCharge: true // Flag to identify preparation charges
          };
          this.invoiceItems.update(items => [...items, chargeItem]);
        });
      },
      error: (error) => {
        console.error('Failed to load preparation charges', error);
      }
    });
  }

  markPreparationChargesAsApplied(invoiceId: number): void {
    this.salesService.markPreparationChargesAsApplied(invoiceId).subscribe({
      next: () => {
        console.log('Preparation charges marked as applied');
      },
      error: (error) => {
        console.error('Failed to mark preparation charges as applied', error);
      }
    });
  }

  openCarSelectionDialog(): void {
    const storeId = this.invoiceForm.get('store')?.value;

    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {
        storeId: storeId,
        fromSales: true // Flag to indicate opened from sales
      },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(selectedCar => {
      if (selectedCar) {
        this.addCarToInvoice(selectedCar);
      }
    });
  }

  /** Smart searchable customer selector (Requirement: search by mobile/national ID/name, then
   * auto-populate). Setting the 'customer' control here re-uses the existing valueChanges
   * subscription (see ngOnInit) that updates `selectedCustomer` and checks pending orders --
   * no separate population logic needed. */
  openCustomerLookup(): void {
    const customerControl = this.invoiceForm.get('customer');
    if (customerControl?.disabled) return; // locked once inherited from a quotation

    const dialogRef = this.dialog.open<CustomerLookupModalComponent, unknown, Customer | null>(CustomerLookupModalComponent, {
      width: '90vw',
      maxWidth: '900px',
      height: '80vh',
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(customer => {
      if (customer) {
        customerControl?.setValue(customer.id);
        customerControl?.markAsTouched();
      }
    });
  }

 addItemToInvoice(): void {

  const customerId = this.invoiceForm.get('customer')?.value;
  const carId = this.invoiceForm.get('selectedCarId')?.value;
  const quantity = this.invoiceForm.get('selectedQuantity')?.value;
  const unitPrice = this.invoiceForm.get('selectedCostPrice')?.value;

  // ---- 1. Validate form selections ----
  if (!customerId) {
    this.notificationService.showError('INVOICE.SELECT_CUSTOMER');
    return;
  }

  if (!carId) {
    this.notificationService.showError('INVOICE.SELECT_CAR');
    return;
  }

  if (!quantity || quantity <= 0) {
    this.notificationService.showError('INVOICE.INVALID_QUANTITY');
    return;
  }

  if (!unitPrice || unitPrice <= 0) {
    this.notificationService.showError('INVOICE.INVALID_PRICE');
    return;
  }

  // ---- 2. Get stock item ----
  const stockItem = this.carStocks().find(c => c.carId === carId);

  if (!stockItem) {
    this.notificationService.showError('INVOICE.CAR_NOT_FOUND');
    return;
  }

  if (quantity > stockItem.availableQuantity) {
    this.notificationService.showError(
      `${this.translate.instant('INVOICE.QUANTITY')} (${quantity}) `
      + `${this.translate.instant('COMMON.STOCK_LESS')} (${stockItem.availableQuantity}).`
    );
    return;
  }

  // ---- 3. Check if already exists ----
  const alreadyExists = this.invoiceItems().some(item => item.carId === carId);
  if (alreadyExists) {
    this.notificationService.showError('INVOICE.ALREADY_ADDED');
    return;
  }

  // ---- 4. Build invoice item ----
  const newItem: InvoiceItem = {
    lineKey: this.allocateLineKey(),
    carId: stockItem.carId,
    carName: stockItem.carName,
    carDescription: stockItem.carName,
    quantity,
    unitPrice,
    salesPrice: unitPrice,
    lineTotal: this.calc.calculateLineTotal(quantity, unitPrice),
    carImage: null
  };

  // ---- 5. Update invoice items ----
  this.invoiceItems.update(items => [...items, newItem]);

  // ---- 6. Reset form controls ----
  this.invoiceForm.patchValue({
    selectedCarId: null,
    selectedQuantity: 1,
    selectedCostPrice: 0
  });
}

  
  removeItem(lineKey: number): void {
    this.invoiceItems.update(items => items.filter(item => item.lineKey !== lineKey));
  }

  /** DevExtreme's dxDataGrid has no "onCellValueChanged" event (there never was one -- it doesn't
   * appear anywhere in the devextreme package, so the previous binding of that name in the
   * template silently never fired). The documented way to recompute a dependent column while a
   * cell is still being edited is a per-column `setCellValue`: it runs inside the grid's own
   * edit-buffer merge, so the Line Total cell updates live, in the same edit cycle, instead of
   * waiting on an external round-trip through this component. See setPriceValue below for the
   * other half of the pair. */
  setQuantityValue = (newData: Partial<InvoiceItem>, value: unknown, currentRowData: InvoiceItem): void => {
    const quantity = Math.max(0, Number(value) || 0);
    const salesPrice = Math.max(0, currentRowData.salesPrice ?? currentRowData.unitPrice ?? 0);
    newData.quantity = quantity;
    newData.lineTotal = this.calc.calculateLineTotal(quantity, salesPrice);
  };

  setPriceValue = (newData: Partial<InvoiceItem>, value: unknown, currentRowData: InvoiceItem): void => {
    const salesPrice = Math.max(0, Number(value) || 0);
    const quantity = Math.max(0, currentRowData.quantity || 0);
    newData.salesPrice = salesPrice;
    newData.unitPrice = salesPrice; // keep unitPrice in sync -- print view and payload still read it
    newData.lineTotal = this.calc.calculateLineTotal(quantity, salesPrice);
  };

  /** `mode: 'cell'` auto-saves each cell edit as soon as it commits, so onRowUpdated fires once per
   * edit with the final merged row (already carrying the recalculated lineTotal from
   * setQuantityValue/setPriceValue above). Mirroring that into the invoiceItems signal
   * here -- rather than trying to react per keystroke -- is what cascades into the
   * subtotal/discount/VAT/total computed signals that drive the summary rail outside the grid.
   * Matched by lineKey, not carId: a vehicle's preparation-charge lines intentionally reuse the
   * vehicle's carId, so carId alone can't identify a single row. */
  onInvoiceItemRowUpdated(event: { data: InvoiceItem }): void {
    const updated = event.data;
    this.invoiceItems.update(items => items.map(item => item.lineKey === updated.lineKey ? updated : item));
  }


  // =====================================================================
  // Shared document UI integration (DocumentToolbar / DocumentPrintService).
  // Presentation-only: all calculations stay in the existing computed
  // signals and backend services.
  // =====================================================================

  /** Serialized form + items state used as the dirty-tracking baseline. */
  private documentSnapshot = '';

  private captureDocumentSnapshot(): void {
    this.documentSnapshot = this.serializeDocumentState();
  }

  private serializeDocumentState(): string {
    if (!this.invoiceForm) return '';
    return JSON.stringify({
      form: this.invoiceForm.getRawValue(),
      items: this.invoiceItems()
    });
  }

  /** True when the user modified the document since the last load/save. Drives
   * the shared print workflow: clean documents print directly, dirty ones are
   * saved first so we never print stale server data. */
  isDocumentDirty(): boolean {
    if (!this.invoiceForm) return false;
    return this.serializeDocumentState() !== this.documentSnapshot;
  }

  /** Same validity rule the save button always enforced, now feeding the shared toolbar. */
  private canSaveInvoice(): boolean {
    return !!this.invoiceForm?.get('customer')?.valid
      && !!this.invoiceForm?.get('invoiceDate')?.valid
      && !this.invoiceForm?.get('discountValue')?.invalid
      && this.invoiceItems().length > 0;
  }

  /** Unified toolbar configuration -- rendered by DocumentToolbarComponent at the
   * top of the page and in the sticky summary rail. */
  toolbarActions(): DocumentAction[] {
    const canSave = this.canSaveInvoice();
    return [
      {
        id: 'save',
        label: this.isEditMode() ? 'COMMON.SAVE' : 'INVOICE.ISSUE',
        icon: 'save',
        variant: 'primary',
        disabled: !canSave,
        execute: () => this.saveInvoice()
      },
      {
        id: 'save-print',
        label: 'DOCUMENT_COMMON.ACTIONS.SAVE_AND_PRINT',
        icon: 'print',
        variant: 'accent',
        disabled: !canSave,
        execute: () => this.printInvoice()
      },
      {
        id: 'print',
        label: 'DOCUMENT_COMMON.ACTIONS.PRINT',
        icon: 'print',
        variant: 'basic',
        visible: this.isEditMode(),
        // A clean persisted document can always be printed; a dirty one only if it can be saved first.
        disabled: this.isDocumentDirty() && !canSave,
        execute: () => this.printInvoice()
      },
      {
        id: 'cancel',
        label: 'INVOICE.CANCEL',
        icon: 'close',
        variant: 'basic',
        execute: () => this.router.navigate(['/sales'])
      }
    ];
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
      save: () => this.saveInvoiceCore(this.isEditMode() ? false : true),
      print: id => this.printWorkflow.openPrintRoute(`/#/sales/invoice/print/${id}`),
      onSettled: () => this.saving.set(false)
    });
  }

  /** Issue/Save entry point. `navigateAfterSave=true` only actually navigates for the Bank Sales
   *  (Bunuk) workflow, which continues to Vehicle Delivery as its next deliberate step; every other
   *  channel stays on this screen and switches in place into editing the newly created invoice. */
  saveInvoice(): void {
    this.saving.set(true);
    this.saveInvoiceCore(true).pipe(finalize(() => this.saving.set(false))).subscribe();
  }

  /**
   * The screen's single save pipeline. Returns the SERVER-CONFIRMED document id,
   * or null when validation/save failed. Both the Save button and the shared
   * save-before-print workflow funnel through here -- no duplicated save logic.
   */
  private saveInvoiceCore(navigateAfterSave: boolean): Observable<number | null> {
    const storeId = this.invoiceForm.get('storeId')?.value;
    const customerId = this.invoiceForm.getRawValue().customer;
    const customer = this.customers().find(c => c.id === customerId);
    const items = this.invoiceItems();

    if (!storeId) {
      this.notificationService.showError('INVOICE.SELECT_STORE');
      return of(null);
    }
    if (!customerId || !customer) {
      this.notificationService.showError('INVOICE.SELECT_CUSTOMER_OPTION');
      return of(null);
    }
    if (items.length === 0) {
      this.notificationService.showError('INVOICE.ADD_AT_LEAST_ONE');
      return of(null);
    }

    // Prepare invoice data (adjust fields as needed)
    const invoiceData: any = {
      id: this.isEditMode() ? this.currentInvoiceId()! : 0,
      invoiceNumber: this.invoiceNumber(),
      invoiceDate: this.invoiceForm.get('invoiceDate')?.value.toISOString(),
      customerId,
      customerName: customer.name,
      storeId,
      ClassificationId: this.invoiceForm.get('ClassificationId')?.value,
      paymentMethod: this.invoiceForm.get('paymentMethod')?.value,
      paymentType: this.invoiceForm.get('paymentType')?.value,
      invoiceType: this.invoiceForm.get('invoiceType')?.value,
      salesperson: this.invoiceForm.get('salesperson')?.value,
      isCash: this.isCash,
      salesChannel: this.channel,
      saleType: this.saleType,
      downPayment: this.invoiceForm.get('downPayment')?.value || 0,
      quotationId: this.linkedQuotation()?.id,
      quotationNumber: this.linkedQuotation()?.quotationNumber,
      sourceOrderId: this.selectedCustomerOrder()?.id || null,
      // lineKey is a client-side-only grid row identity (see InvoiceItem.lineKey) -- strip it so
      // it doesn't leak into the persisted record.
      items: items.map(({ lineKey, ...item }) => item),
      // Full financial breakdown -- computed once via calculateSalesInvoiceFinancials so these
      // numbers are guaranteed consistent with what the summary rail and the printed invoice show.
      subtotal: this.subtotal(),
      discountType: this.discountTypeSignal(),
      discountValue: this.discountValueSignal(),
      discountAmount: this.discountAmount(),
      amountAfterDiscount: this.amountAfterDiscount(),
      vatRate: this.vatRate(),
      vatAmount: this.vatAmount(),
      totalAmount: this.totalAmount(),
      previousPayments: this.previousPayments(),
      currentPayment: this.currentPayment(),
      remainingBalance: this.remainingBalance(),
      notes: this.invoiceForm.get('notes')?.value || '',
      isArchived: false,
      // amountPaid/amountDue/status are derived server-side from isCash + downPayment - see
      // SalesInvoiceService.CreateInvoiceEntityAsync / RecalculatePaymentFields.
      ownershipTransferStatus: 'Not Started',
      depositId: this.selectedDeposit()?.id || null,
      // CASH: the requested Cash/Bank settlement account (backend re-validates + falls back to
      // its seeded default Cash). CREDIT/INSTALLMENT with a down payment (Mixed Sale): the
      // requested Cash/Bank account for the down-payment leg -- Customer AR still carries the
      // remaining balance and is always server-resolved. Undefined drops the field from the JSON
      // payload on a credit/installment sale with NO down payment, where there's no cash leg at
      // all to attach an account to.
      paymentAccountId: (this.isCash || this.hasDownPayment())
        ? (this.invoiceForm.get('paymentAccountId')?.value ?? undefined)
        : undefined,
      // Optional client override of the Credit (Revenue) leg -- re-validated server-side (exists,
      // tenant-scoped, active, postable) and used verbatim when present; undefined (never
      // touched, or "Reset to Default" clicked back to a resolution the tracker couldn't confirm)
      // falls back to the existing derivation (SalesInvoiceService.ResolveRevenueAccountIdAsync).
      // Entirely independent of the VAT/COGS/Payment-account fields above. No debitAccountId
      // sent: the Debit leg (Cash/Bank or Customer AR) is this document's system-resolved side
      // and the backend always derives it via ResolveSaleDebitAccountIdAsync.
      creditAccountId: this.invoiceForm.get('creditAccountId')?.value ?? undefined,
    };

    if (this.channel === SalesChannel.Bunuk) {
      invoiceData.ownerCustomerId = customerId;
      invoiceData.funderBankId = this.selectedCustomerOrder()?.bankId || null;
    }

    // Credit/installment sales require the customer's Accounts Receivable account to already be
    // resolvable server-side -- check proactively so the user finds out (and can fix it inline via
    // "Link Account") before filling out the whole invoice, instead of only on a rejected save.
    // Cash sales never need this: their debit leg is the payment account, not the customer's AR.
    const partyCheck$ = this.isCash
      ? of(true)
      : warnIfPartyAccountMissing(this.dialog, this.customerService.hasReceivableAccount(customerId), 'customer', customerId, customer.name);

    return partyCheck$.pipe(
      switchMap(canProceed => {
        if (!canProceed) return of(null);

        if (this.isEditMode()) {
          return this.salesService.updateInvoice(invoiceData).pipe(
            map(() => {
              this.notificationService.showSuccess('TOAST.UPDATE_SUCCESS');
              // Re-baseline dirty tracking so Print now sees a clean document.
              this.captureDocumentSnapshot();
              return this.currentInvoiceId();
            }),
            catchError(error => {
              console.error('Error updating sales invoice:', error);
              this.notificationService.showError(extractErrorMessage(error, this.translate, 'TOAST.SAVE_ERROR'));
              return of(null);
            })
          );
        }

        return this.salesService.addInvoice(invoiceData).pipe(
          tap(savedInvoice => {
            this.notificationService.showSuccess('TOAST.ADD_SUCCESS');
            // Mark preparation charges as applied
            this.markPreparationChargesAsApplied(savedInvoice.id);
            // Mark customer order as invoiced
            const order = this.selectedCustomerOrder();
            if (order?.id) {
              this.salesService.markCustomerOrderAsInvoiced(order.id).subscribe();
            }
            // Mark deposit as invoiced
            const deposit = this.selectedDeposit();
            if (deposit) {
              this.depositService.markDepositAsInvoiced(deposit.id).subscribe();
            }
            if (navigateAfterSave) {
              if (this.channel === SalesChannel.Bunuk) {
                // Bank Sales workflow: continue to Vehicle Delivery -- a deliberate next step in a
                // multi-step process, not an accidental redirect, left untouched.
                this.router.navigate(['/sales/bank/deliveries/new'], { queryParams: { invoiceId: savedInvoice.id } });
              } else {
                // Stay on this screen: switch in place from "new" to "editing the invoice just
                // created" instead of leaving to the sales list. currentInvoiceId/isEditMode drive
                // every downstream save/print/edit decision in this component (toolbar labels,
                // saveInvoiceCore's `id` field, printInvoice's isPersisted flag), so flipping them
                // here makes the rest of the screen behave exactly as if the user had navigated to
                // the edit route -- without an actual navigation/reload. The URL is updated to match
                // via replaceState (no NavigationEnd event, no component teardown) so a refresh or
                // back-button still lands on/leaves the right place.
                this.currentInvoiceId.set(savedInvoice.id);
                this.isEditMode.set(true);
                const newUrl = this.router.url.replace(/\/new(\?|$)/, `/edit/${savedInvoice.id}$1`);
                this.location.replaceState(newUrl);
              }
            }
          }),
          map(savedInvoice => {
            // Re-baseline dirty tracking so Print now sees a clean document.
            this.captureDocumentSnapshot();
            return savedInvoice.id;
          }),
          catchError(error => {
            console.error('Error saving sales invoice:', error);
            this.notificationService.showError(extractErrorMessage(error, this.translate, 'TOAST.SAVE_ERROR'));
            return of(null);
          })
        );
      })
    );
  }

  /** Rows for the shared totals block -- same computed signals the summary rail always used. */
  totalsRows(): DocumentTotalsRow[] {
    const fmt = (v: number) => formatCurrency(v, this.localeId, 'SAR', 'symbol', '1.0-2');
    const rows: DocumentTotalsRow[] = [
      { labelKey: 'INVOICE.SUBTOTAL', value: fmt(this.subtotal()) }
    ];

    if (this.discountAmount() > 0) {
      const isPercentage = this.invoiceForm.get('discountType')?.value === 'Percentage';
      rows.push({
        labelKey: 'INVOICE.DISCOUNT',
        hint: isPercentage
          ? (this.invoiceForm.get('discountValue')?.value + '%')
          : this.translate.instant('INVOICE.DISCOUNT_FIXED'),
        value: '- ' + fmt(this.discountAmount())
      });
    }

    rows.push({ labelKey: 'INVOICE.AMOUNT_AFTER_DISCOUNT', value: fmt(this.amountAfterDiscount()) });
    rows.push({ labelKey: 'INVOICE.VAT', hint: `${this.vatRate()}%`, value: '+ ' + fmt(this.vatAmount()) });

    if (this.hasMarginVatItems()) {
      rows.push({ labelKey: 'INVOICE.MARGIN_VAT_NOTE', kind: 'muted', value: '' });
    }

    rows.push({ labelKey: 'INVOICE.TOTAL', kind: 'total', value: fmt(this.totalAmount()) });

    // Payment breakdown order preserved from the previous summary rail:
    // Previously Paid -> Down Payment (if any) -> Current Amount -> Amount Paid -> Remaining Balance.
    if (this.previousPayments() > 0) {
      rows.push({ labelKey: 'INVOICE.PREVIOUS_PAYMENTS', value: '- ' + fmt(this.previousPayments()) });
    }
    if (this.saleType !== SaleType.Cash) {
      rows.push({ labelKey: 'INVOICE.DOWN_PAYMENT', value: fmt(this.downPaymentSignal()) });
    }
    rows.push({ labelKey: 'INVOICE.CURRENT_PAYMENT', value: '- ' + fmt(this.currentPayment()) });
    rows.push({ labelKey: 'INVOICE.AMOUNT_PAID', value: fmt(this.previewAmountPaid()) });
    rows.push({ labelKey: 'INVOICE.REMAINING_BALANCE', kind: 'total', value: fmt(this.remainingBalance()) });

    const statusKey = this.previewStatus();
    if (statusKey) {
      rows.push({ labelKey: 'INVOICE.STATUS', kind: 'muted', value: this.translate.instant(statusKey) });
    }

    return rows;
  }

}