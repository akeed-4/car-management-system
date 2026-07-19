import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AbstractControl, ReactiveFormsModule, FormControl, ValidationErrors, Validators, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { StoreService } from '../../../services/store.service';
import { DepositService } from '../../../services/deposit.service';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { Customer } from '../../../models/customer.model';
import { InvoiceClassificationOption } from '../../../models/invoice-classification.model';
import { AccountNode } from '../../../models/account-node.model';
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
import { provideNativeDateAdapter } from '@angular/material/core';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';
import { CarSelectionDialogComponent } from '../car-selection-dialog/car-selection-dialog.component';
import { DxoValueErrorBarComponent } from 'devextreme-angular/ui/nested';
import { NotificationService } from '@/src/services/notification.service';
import { AccountingService } from '../../accounting/accounting.service';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';
import { CashAmountCalculatorComponent } from '../../shared/cash-amount-calculator/cash-amount-calculator.component';
import { DiscountType } from '../../../models/sales-invoice-financials';
import { SalesInvoiceCalculationService } from '../../../services/sales-invoice-calculation.service';

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
    DxDataGridModule,
    TranslateModule,
    CashAmountCalculatorComponent,
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
    private storeService = inject(StoreService);
    private accountingService = inject(AccountingService);
    private depositService = inject(DepositService);
    private router = inject(Router);
    private translate = inject(TranslateService);
    private dialog = inject(MatDialog);
    private route = inject(ActivatedRoute);
    private notificationService = inject(NotificationService);
    private calc = inject(SalesInvoiceCalculationService);

    @Input() lockPaymentMethod = false;
    @Input() fixedPaymentMethod: string | null = null;
    @Input() customTitle: string | null = null;
  @Input() titleKey = 'INVOICE.CREATE_TITLE';
    /** Sales distribution channel (Afrad/Sharikat/Bunuk) — drives which fields are shown. */
    @Input() channel: SalesChannel = SalesChannel.Afrad;
    /** Cash / Credit / Installments — drives down-payment and payment-method behavior. */
    @Input() saleType: SaleType = SaleType.Cash;
    // Expose enums to template
    InvoiceType = InvoiceType;
    SalesChannel = SalesChannel;
    SaleType = SaleType;
    /** Derived from saleType for backward compatibility with the payload/edit-mode logic below. */
    get isCash(): boolean {
      return this.saleType === SaleType.Cash;
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
  stores = this.storeService.stores$;
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
  selectedCustomer = signal<Customer | null>(null);

  // Invoice type signal
  invoiceType = signal<InvoiceType>(InvoiceType.Taxable);

  // Invoice classification signals
  invoiceClassifications = signal<InvoiceClassificationOption[]>([]);
  selectedInvoiceClassification = signal<InvoiceClassificationOption | null>(null);

  // Account signals
  debitAccounts = signal<AccountNode[]>([]);
  creditAccounts = signal<AccountNode[]>([]);

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
        storeId: new FormControl(null, Validators.required),
        customer: new FormControl(null, Validators.required),
        debitAccount: new FormControl(null, Validators.required),
        creditAccount: new FormControl(null, Validators.required),
        invoiceDate: new FormControl(new Date(), Validators.required),
        dueDate: new FormControl(''),
        paymentMethod: new FormControl('Cash'),
        paymentType: new FormControl(this.fixedPaymentMethod || 'Bank Transfer'),
        invoiceType: new FormControl(InvoiceType.Taxable, Validators.required),
        ClassificationId: new FormControl(0, Validators.required),
        salesperson: new FormControl(''),
        selectedCarId: new FormControl(null),
        selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
        notes: new FormControl(''),
        selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
        downPayment: new FormControl(0),
        discountType: new FormControl<DiscountType>('Fixed'),
        discountValue: new FormControl(0, [Validators.min(0), this.discountExceedsSubtotalValidator])
      });
      this.updateDownPaymentValidators();
      this.watchAmountReceivedControls();
      this.watchDiscountControls();
      this.watchClassificationAndTypeControls();
      this.watchPaymentTypeControl();

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
    });

    // Load accounts
    this.loadAccounts();

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
  }

  /** Keeps amountReceivedSignal (used by the live Paid/Due/Status preview) in sync with the
   * downPayment form control for credit/installment sales. Cash sales always show the full total. */
  private watchAmountReceivedControls(): void {
    this.invoiceForm.get('downPayment')?.valueChanges.subscribe((value: number) => {
      if (!this.isCash) {
        this.amountReceivedSignal.set(Number(value) || 0);
      }
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
          debitAccount: new FormControl(invoice.debitAccountId, Validators.required),
          creditAccount: new FormControl(invoice.creditAccountId, Validators.required),
          invoiceType: new FormControl(invoice.invoiceType || InvoiceType.Taxable, Validators.required),
          selectedCarId: new FormControl(null),
          selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
          notes: new FormControl(invoice.notes || ''),
          selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
          downPayment: new FormControl(invoice.downPayment || 0),
          discountType: new FormControl<DiscountType>(invoice.discountType || 'Fixed'),
          discountValue: new FormControl(invoice.discountValue || 0, [Validators.min(0), this.discountExceedsSubtotalValidator])
        });
        this.updateDownPaymentValidators();
        this.amountReceivedSignal.set(invoice.isCash ? invoice.totalAmount : (invoice.downPayment || invoice.amountPaid || 0));
        this.originalAmountPaid.set(invoice.amountPaid || 0);
        this.watchAmountReceivedControls();
        this.watchDiscountControls();
        this.watchClassificationAndTypeControls();
        this.watchPaymentTypeControl();

        // Set invoice number and items
        this.invoiceNumber.set(invoice.invoiceNumber);
        // Backend-loaded items don't carry a lineKey -- assign one so the grid's row identity is
        // unique even when a prep-charge line shares its carId with the vehicle line it belongs to.
        this.invoiceItems.set((invoice.items || []).map(item => ({ ...item, lineKey: this.allocateLineKey() })));
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
    const car = this.allCars().find(c => c.id === vehicleId);
    if (car) {
      this.addCarToInvoice(car);
    }
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

  private loadAccounts(): void {
    // Load debit accounts (sales revenue/income)
    this.accountingService.getAccountsByCategory('debit').subscribe(accounts => {
      this.debitAccounts.set(accounts);
      console.log('Debit accounts loaded', accounts);
    });

    // Load credit accounts (customer/cash/bank)
    this.accountingService.getAccountsByCategory('credit').subscribe(accounts => {
      this.creditAccounts.set(accounts);
      console.log('Credit accounts loaded', accounts);
    });
  }

  toggleCarCards(): void {
    const storeId = this.invoiceForm.get('storeId')?.value;
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CarSelectionDialogComponent's own result is untyped (its `cars` signal is `any[]`); typing this parameter would just hide that, not fix it.
    addCarToSales(car: any): void {
    // Check if already exists
    const alreadyExists = this.invoiceItems().some(item => item.carId === car.id);
    if (alreadyExists) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    // Create invoice item with default quantity of 1
    const newItem: InvoiceItem = {
      lineKey: this.allocateLineKey(),
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
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

  /** Subtotal before discount -- sum of all line totals. */
  subtotal = computed(() => this.calc.calculateSubtotal(this.invoiceItems()));

  /** VAT rate (0 or 15) -- the selected classification's own rate wins; falls back to the
   * Taxable/Zero-Rated/Exempt selector when no classification is set. */
  vatRate = computed(() => this.calc.resolveVatRate(this.selectedInvoiceClassification()?.vatRate, this.invoiceTypeSignal()));

  private baseFinancials = computed(() => this.calc.calculateFinancials({
    subtotal: this.subtotal(),
    discountType: this.discountTypeSignal(),
    discountValue: this.discountValueSignal(),
    vatRate: this.vatRate(),
  }));

  discountAmount = computed(() => this.baseFinancials().discountAmount);
  amountAfterDiscount = computed(() => this.baseFinancials().amountAfterDiscount);
  vatAmount = computed(() => this.baseFinancials().vatAmount);
  totalAmount = computed(() => this.baseFinancials().totalAmount);

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
      specs: car.carDescription || 'No description available',
      availableQuantity: car.availableQuantity
    }));
  });

  // Methods for managing invoice items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- called with either the mock allCars shape or CarSelectionDialogComponent's untyped result; neither is a shared model.
  addCarToInvoice(car: any): void {
    const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
      width: '400px',
      data: {
        carName: `${car.make} ${car.model} (${car.year})`,
        quantity: 1,
        unitPrice: car.salePrice || 0,
        maxQuantity: car.availableQuantity
      }
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
          carDescription: `${car.make} ${car.model} (${car.year})`,
          quantity,
          unitPrice,
          salesPrice: unitPrice,
          lineTotal: this.calc.calculateLineTotal(quantity, unitPrice),
          carImage: car.imageUrl
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
      }
    });

    dialogRef.afterClosed().subscribe(selectedCar => {
      if (selectedCar) {
        this.addCarToInvoice(selectedCar);
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
    alert(this.translate.instant('INVOICE.SELECT_CUSTOMER'));
    return;
  }

  if (!carId) {
    alert(this.translate.instant('INVOICE.SELECT_CAR'));
    return;
  }

  if (!quantity || quantity <= 0) {
    alert(this.translate.instant('INVOICE.INVALID_QUANTITY'));
    return;
  }

  if (!unitPrice || unitPrice <= 0) {
    alert(this.translate.instant('INVOICE.INVALID_PRICE'));
    return;
  }

  // ---- 2. Get stock item ----
  const stockItem = this.carStocks().find(c => c.carId === carId);

  if (!stockItem) {
    alert(this.translate.instant('INVOICE.CAR_NOT_FOUND'));
    return;
  }

  if (quantity > stockItem.availableQuantity) {
    alert(
      `${this.translate.instant('INVOICE.QUANTITY')} (${quantity}) `
      + `${this.translate.instant('COMMON.STOCK_LESS')} (${stockItem.availableQuantity}).`
    );
    return;
  }

  // ---- 3. Check if already exists ----
  const alreadyExists = this.invoiceItems().some(item => item.carId === carId);
  if (alreadyExists) {
    alert(this.translate.instant('INVOICE.ALREADY_ADDED'));
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


  saveInvoice(): void {
    const storeId = this.invoiceForm.get('storeId')?.value;
    const customerId = this.invoiceForm.getRawValue().customer;
    const customer = this.customers().find(c => c.id === customerId);
    const items = this.invoiceItems();

    if (!storeId) {
      alert(this.translate.instant('INVOICE.SELECT_STORE'));
      return;
    }
    if (!customerId || !customer) {
      alert(this.translate.instant('INVOICE.SELECT_CUSTOMER_OPTION'));
      return;
    }
    if (items.length === 0) {
      alert(this.translate.instant('INVOICE.ADD_AT_LEAST_ONE'));
      return;
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
      debitAccountId: this.invoiceForm.get('debitAccount')?.value,
      creditAccountId: this.invoiceForm.get('creditAccount')?.value,
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
    };

    if (this.channel === SalesChannel.Bunuk) {
      invoiceData.ownerCustomerId = customerId;
      invoiceData.funderBankId = this.selectedCustomerOrder()?.bankId || null;
    }

    if (this.isEditMode()) {
      this.salesService.updateInvoice(invoiceData).subscribe({
        next: () => {
          this.notificationService.showSuccess('TOAST.UPDATE_SUCCESS');
        },
        error: () => {
          this.notificationService.showError('TOAST.SAVE_ERROR');
        }
      });
    } else {
      this.salesService.addInvoice(invoiceData).subscribe({
        next: (savedInvoice) => {
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
          if (this.channel === SalesChannel.Bunuk) {
            // Bank Sales workflow: continue to Vehicle Delivery
            this.router.navigate(['/sales/bank/deliveries/new'], { queryParams: { invoiceId: savedInvoice.id } });
          } else {
            this.router.navigate(['/sales']);
          }
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError('TOAST.SAVE_ERROR');
        }
      });
    }
  }
  
}