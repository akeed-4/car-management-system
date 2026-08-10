
import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
import { StoreService } from '../../../services/store.service';
import { SalesService } from '../../../services/sales.service';
import { ChartOfAccountsService } from '../../../services/chart-of-accounts.service';
import { VinService } from '../../../services/vin.service';
import { PurchaseInvoice, AuctionCharge } from '../../../models/purchase-invoice.model';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { Car } from '../../../models/car.model';
import { Supplier } from '../../../models/supplier.model';
import { Account } from '../../accounting/models';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { InvoiceClassificationOption } from '../../../models/invoice-classification.model';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../../sales/invoice-item-dialog/invoice-item-dialog.component';
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

const VAT_RATE = 0.15; // 15% VAT

export enum InvoiceType {
  Taxable = 'Taxable',
  ZeroRated = 'Zero Rated',
  Exempt = 'Exempt'
}

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AccountingService } from '../../accounting/accounting.service';
import { NotificationService } from '../../../services/notification.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { CarsReceiptNoteService } from '@/src/services/cars-receipt-note.service';
import { CarsReceiptNoteDto } from '@/src/models/cars-receipt-note.model';
import { CashAmountCalculatorComponent } from '../../shared/cash-amount-calculator/cash-amount-calculator.component';
import { PurchaseAdditionalCostListComponent } from '../purchase-additional-cost-list/purchase-additional-cost-list.component';
import { PurchaseAdditionalCostFormComponent } from '../purchase-additional-cost-form/purchase-additional-cost-form.component';

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
    DxDataGridModule,
    NgxMatSelectSearchModule,
    PurchaseAdditionalCostListComponent,
    PurchaseAdditionalCostFormComponent,
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
  private currentSettingService = inject(CurrentSettingService);
  private storeService = inject(StoreService);
  private salesService = inject(SalesService);
  private accountingService = inject(AccountingService);
  private languageService = inject(LanguageService);
  private carsReceiptNoteService = inject(CarsReceiptNoteService);
  private vinService = inject(VinService);
  private purchaseCycleService = inject(PurchaseCycleService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private toastService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private oidcSecurityService = inject(OidcSecurityService);
  
  // User and showroom information
  private currentUserId = signal<number | null>(null);
  private currentShowroomId = signal<number>(1); // Default showroom, adjust as needed
  
  cardLayout2 = this.currentSettingService.getCardLayout(2);
  cardLayout3 = this.currentSettingService.getCardLayout(3);
  cardLayout4 = this.currentSettingService.getCardLayout(4);
  cardLayout5 = this.currentSettingService.getCardLayout(5);
  cardLayout6 = this.currentSettingService.getCardLayout(6);

  // Services state
  suppliers = signal<Supplier[]>([]);
  stores = this.storeService.stores$;
  cars = this.inventoryService.cars$;
  carStocks = signal<StoreCarStockDto[]>([]);
  debitAccounts = signal<Account[]>([]);
  creditAccounts = signal<Account[]>([]);
  textDir: Direction = this.languageService.getCurrentLanguage() == 'en' ? 'ltr' : 'rtl';

  // Filter controls for mat-select search
  supplierFilterCtrl = new FormControl('');
  debitAccountFilterCtrl = new FormControl('');
  creditAccountFilterCtrl = new FormControl('');
  paymentMethodFilterCtrl = new FormControl('');

  // Convert filter controls to signals
  private supplierFilterSignal = toSignal(this.supplierFilterCtrl.valueChanges, { initialValue: '' });
  private debitAccountFilterSignal = toSignal(this.debitAccountFilterCtrl.valueChanges, { initialValue: '' });
  private creditAccountFilterSignal = toSignal(this.creditAccountFilterCtrl.valueChanges, { initialValue: '' });
  private paymentMethodFilterSignal = toSignal(this.paymentMethodFilterCtrl.valueChanges, { initialValue: '' });

  // Filtered signals
 filteredSuppliers = computed(() => {

  const filter = this.supplierFilterSignal()?.toLowerCase() ?? '';

  return this.suppliers().filter(s =>
    s.name?.toLowerCase().includes(filter)
  );
});

  filteredDebitAccounts = computed(() => {
    const filter = this.debitAccountFilterSignal()?.toLowerCase() || '';
    return this.debitAccounts().filter(a =>
      (a.accountNameAr?.toLowerCase().includes(filter) ?? false) || (a.accountCode?.toLowerCase().includes(filter) ?? false)
    );
  });

  filteredCreditAccounts = computed(() => {
    const filter = this.creditAccountFilterSignal()?.toLowerCase() || '';
    return this.creditAccounts().filter(a =>
      (a.accountNameAr?.toLowerCase().includes(filter) ?? false) || (a.accountCode?.toLowerCase().includes(filter) ?? false)
    );
  });

  paymentMethods = [
    { value: 'Cash', label: 'PURCHASE_INVOICE.PAYMENT_CASH' },
    { value: 'Credit (Deferred)', label: 'PURCHASE_INVOICE.PAYMENT_CREDIT' },
    { value: 'Bank Transfer', label: 'PURCHASE_INVOICE.PAYMENT_BANK_TRANSFER' },
    { value: 'Check', label: 'PURCHASE_INVOICE.PAYMENT_CHECK' }
  ];

  filteredPaymentMethods = computed(() => {
    const filter = this.paymentMethodFilterSignal()?.toLowerCase() || '';
    return this.paymentMethods.filter(p =>
      this.translate.instant(p.label).toLowerCase().includes(filter)
    );
  });

  // Layout for responsive design
  layout$ = this.currentSettingService.getCardLayout(4);

  // Edit mode signals
  isEditMode = signal(false);
  currentInvoiceId = signal<number | null>(null);
  invoiceNumberSignal = signal<string>('');

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
      // Apply VAT rate from selected classification
      return subtotalValue * (classification.vatRate / 100);
    }
    
    // No VAT for zero-rated or exempt classifications
    return 0;
  });
  
  // Auction charges are folded in on top of the item subtotal+VAT, matching the backend
  // (PurchaseInvoiceService.CreateAsync: totalAmount = createDto.TotalAmount + auctionChargesTotal).
  totalAmount = computed(() => Math.round(this.subtotal() + this.vatAmount() + this.auctionChargesTotal()));

  /** True when the current payment type is cash - drives the auto-paid summary + cash calculator. */
  isCashPayment = computed(() => (this.purchaseInvoiceForm?.get('paymentType')?.value ?? '').toString().toLowerCase() === 'cash');

  /** True for either the base route's own dropdown value ('Credit (Deferred)') or, when locked
   * via a Cash/Credit wrapper, the lowercase 'credit' fixedPaymentMethod value -- drives the Due
   * Date field's visibility for both the unlocked and locked Purchase Invoice flows. */
  isCreditPayment = computed(() => {
    const paymentMethod = (this.purchaseInvoiceForm?.get('paymentMethod')?.value ?? '').toString().toLowerCase();
    return paymentMethod === 'credit (deferred)' || paymentMethod === 'credit';
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
    }

    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });

    // Load accounts
    this.loadAccounts();

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
    applyFieldLock(this.purchaseInvoiceForm.get('paymentMethod'), { value: this.fixedPaymentMethod, disable: true });
    applyFieldLock(this.purchaseInvoiceForm.get('paymentType'), { value: this.fixedPaymentMethod, disable: true });
    this.paymentMethodSignal.set(this.fixedPaymentMethod);
  }



  /**
   * Handle payment method locking based on input properties
   */
 
  private loadAccounts(): void {
    // Debit/Credit selectors must only offer leaf/postable accounts -- parent/grouping accounts
    // are excluded server-side by this endpoint, not filtered client-side from the category list.
    this.accountingService.getPostableAccounts('debit').subscribe(accounts => {
      this.debitAccounts.set(accounts);
    });

    this.accountingService.getPostableAccounts('credit').subscribe(accounts => {
      this.creditAccounts.set(accounts);
    });
  }

  private initForm(): void {
    this.purchaseInvoiceForm = this.fb.group({
      supplierId: [null, Validators.required],
      storeId: [null, Validators.required],
      debitAccountId: [null, Validators.required],
      creditAccountId: [null, Validators.required],
      invoiceDate: [new Date(), Validators.required],
      paymentMethod: [this.fixedPaymentMethod , Validators.required],
      paymentType: [this.fixedPaymentMethod || 'Bank Transfer'],
      dueDate: [null], // Optional, required only for credit invoices
      invoiceType: [InvoiceType.Taxable, Validators.required],
      ClassificationId: [0, Validators.required],
      initialPayment: [0, [Validators.min(0)]],
      notes: [''],
      isAuctionPurchase: [false],
      auctionProvider: [null],
      auctionLotNumber: ['']
    }, { validators: [this.accountValidator, this.dueDateValidator] });

    // Set payment method signal
    this.paymentMethodSignal.set(this.fixedPaymentMethod || 'Bank Transfer');

    // Set initial invoice type
    this.invoiceType.set(InvoiceType.Taxable);
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
    });
  }

  private accountValidator(group: AbstractControl): { [key: string]: any } | null {
    const debitAccountId = group.get('debitAccountId')?.value;
    const creditAccountId = group.get('creditAccountId')?.value;
    if (debitAccountId && creditAccountId && debitAccountId === creditAccountId) {
      return { sameAccount: true };
    }
    return null;
  }

  /** paymentMethod holds either the base route's own dropdown value ('Credit (Deferred)') or,
   * when locked via a Cash/Credit wrapper, the lowercase 'cash'/'credit' fixedPaymentMethod value
   * -- match both shapes so a locked Credit Purchase Invoice still requires a due date. */
  private dueDateValidator(group: AbstractControl): { [key: string]: any } | null {
    const paymentMethod = (group.get('paymentMethod')?.value ?? '').toString().toLowerCase();
    const dueDate = group.get('dueDate')?.value;
    const isCredit = paymentMethod === 'credit (deferred)' || paymentMethod === 'credit';

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
          debitAccountId: [invoice.debitAccountId, Validators.required],
          creditAccountId: [invoice.creditAccountId, Validators.required],
          invoiceDate: [new Date(invoice.invoiceDate), Validators.required],
          paymentMethod: [invoice.paymentMethod || 'Bank Transfer'],
          paymentType: [invoice.paymentType || 'credit'],
          dueDate: [invoice.dueDate ? new Date(invoice.dueDate) : null],
          invoiceType: [invoice.invoiceType || InvoiceType.Taxable, Validators.required],
          ClassificationId: [invoice.ClassificationId || 0, Validators.required],
          initialPayment: [invoice.initialPayment || 0, [Validators.min(0)]],
          notes: [invoice.notes || ''],
          isAuctionPurchase: [!!invoice.auctionProvider],
          auctionProvider: [invoice.auctionProvider || null],
          auctionLotNumber: [invoice.auctionLotNumber || ''],
        }, { validators: [this.accountValidator, this.dueDateValidator] });

        this.auctionCharges.set(invoice.auctionCharges || []);

        // ngOnChanges may have already fired (before this async form existed) and found nothing
        // to lock -- apply the lock explicitly now that the real edit-mode form exists, so a
        // Cash/Credit-fixed invoice opened for edit is actually locked, not just on create.
        this.handlePaymentMethodLocking();

        this.amountReceivedSignal.set(invoice.initialPayment || invoice.amountPaid || 0);
        this.originalAmountPaid.set(invoice.amountPaid || 0);
        this.watchInitialPaymentControl();

        // Set invoice number signal
        this.invoiceNumberSignal.set(invoice.invoiceNumber);

        // Set invoice type signal
        this.invoiceType.set((invoice.invoiceType as InvoiceType) || InvoiceType.Taxable);

        // Set invoice items -- this is what populates the DevExtreme grid (bound to
        // invoiceItems() in the template). Re-assigning the signal triggers change detection on
        // its own; no manual ChangeDetectorRef/grid.instance.option() call is needed here.
        this.invoiceItems.set(invoice.items || []);

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

  onStoreSelectionChange(storeId: number | null): void {
    if (storeId) {
      this.loadCarStocks(storeId);
      // Reset selected car when store changes
      this.selectedCarId.set(null);
      this.selectedCar.set(null);
      this.purchasePrice.set(0);
    } else {
      this.carStocks.set([]);
    }
  }

  addItemToInvoice(): void {
    const carId = this.selectedCarId();
    if (!carId) {
      alert(this.translate.instant('PURCHASE_INVOICE.ERROR_SELECT_CAR'));
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
      alert(this.translate.instant('PURCHASE_INVOICE.ERROR_ALREADY_ADDED'));
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

  toggleCarCards(): void {
    const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: {},
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

  saveInvoice(): void {
    if (this.purchaseInvoiceForm.invalid) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_INVALID_FORM');
      return;
    }

    const formValue = this.purchaseInvoiceForm.getRawValue();
    const supplierId = formValue.supplierId;
    const supplier = this.suppliers().find(s => s.id === supplierId);
    const storeId = formValue.storeId;
    const items = this.invoiceItems();

    if (!supplierId || !supplier) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_SELECT_SUPPLIER'));
      return;
    }
    // storeId used to come from CurrentSettingService.getStoreId(), which nothing in the app
    // ever set -- it always returned 0, so a "|| 1" fallback silently targeted store 1. Store
    // ids are per-tenant identity values behind a tenant query filter, so store 1 belongs to
    // whichever tenant owns it and is invisible to everyone else, making every other tenant's
    // Create fail with "Store with ID 1 not found". Now storeId comes from an explicit,
    // required field on this form, like every other invoice form in the app.
    if (!storeId) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_SELECT_STORE'));
      return;
    }
    if (items.length === 0) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_NO_ITEMS'));
      return;
    }
    if (this.totalAmount() <= 0) {
      this.notificationService.showError(this.translate.instant('PURCHASE_INVOICE.ERROR_TOTAL_AMOUNT'));
      return;
    }

    const newInvoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'> = {
      invoiceNumber: this.invoiceNumberSignal() || '',
      invoiceDate: formValue.invoiceDate.toISOString(),
      storeId,
      supplierId: supplierId,
      debitAccountId: formValue.debitAccountId,
      creditAccountId: formValue.creditAccountId,
      paymentType: formValue.paymentType,
      paymentMethod: formValue.paymentMethod,
      dueDate: formValue.dueDate ? formValue.dueDate.toISOString() : undefined,
      ClassificationId: parseInt(formValue.ClassificationId),
      invoiceType: formValue.invoiceType,
      items: items,
      // Pre-auction total (items + VAT) -- the backend adds AuctionCharges on top itself
      // (PurchaseInvoiceService.CreateAsync), so sending the already-inclusive totalAmount()
      // here would double-count the auction fees.
      totalAmount: Math.round(this.subtotal() + this.vatAmount()),
      // Cash invoices are auto-marked fully paid server-side; credit invoices net this off
      // against the total (Requirement 5's "Initial Payment"). Status is derived by the backend.
      initialPayment: this.isCashPayment() ? 0 : this.amountReceivedSignal(),
      notes: formValue.notes,
      status: 'Unpaid',
      isArchived: false,
      carReceiptIds: this.linkedReceiptIds(),
      // Auction fields are only meaningful when the toggle is checked -- otherwise this is a
      // normal supplier purchase and auctionProvider stays null, matching the backend's
      // IsAuctionPurchase(auctionProvider) check.
      auctionProvider: formValue.isAuctionPurchase ? formValue.auctionProvider : null,
      auctionLotNumber: formValue.isAuctionPurchase ? formValue.auctionLotNumber : null,
      auctionCharges: formValue.isAuctionPurchase ? this.auctionCharges() : []
    };

    if (this.isEditMode()) {
      const invoiceId = this.currentInvoiceId();
      if (!invoiceId) {
        this.notificationService.showError('PURCHASE_INVOICE.ERROR_INVALID_ID');
        return;
      }
      this.procurementService.updateInvoice(invoiceId, newInvoice).subscribe({
        next: (savedInvoice) => {
          this.notificationService.showSuccess(this.translate.instant('TOAST.UPDATE_SUCCESS'));
        },
        error: (error) => {
          console.error('Error updating purchase invoice:', error);
          this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      });
    } else {
      this.procurementService.addInvoice(newInvoice).subscribe({
        next: (savedInvoice) => {
            this.notificationService.showSuccess(this.translate.instant('TOAST.ADD_SUCCESS'));
            // Switch into edit mode for the invoice just created -- without this, currentInvoiceId()
            // stays null after a fresh save, so the Additional Costs tab (which requires an existing
            // PurchaseInvoiceId, same as PurchaseAdditionalCost's backend FK) would stay disabled
            // forever in the same session instead of unlocking right after Save like it should.
            this.currentInvoiceId.set(savedInvoice.id);
            this.isEditMode.set(true);
        },
        error: (error) => {
          console.error('Error saving purchase invoice:', error);
          this.notificationService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      });
    }
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
