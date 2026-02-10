
import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { Car } from '../../../models/car.model';
import { Supplier } from '../../../models/supplier.model';
import { AccountNode } from '../../../models/account-node.model';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { InvoiceClassificationOption } from '../../../models/invoice-classification.model';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../../sales/invoice-item-dialog/invoice-item-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSelectChange } from '@angular/material/select';
import { ToastService } from '@/src/services/toast.service';
import { LanguageService } from '@/src/services/language.service';
import { Direction } from '@angular/cdk/bidi';
import { CarSelectionDialogComponent } from './car-selection-dialog/car-selection-dialog.component';
import { VinManagementDialogComponent, VinEntry } from '../vin-management-dialog/vin-management-dialog.component';

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

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatGridListModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatDatepickerModule,
    MatDialogModule,
    DxDataGridModule,
    NgxMatSelectSearchModule,
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
  private vinService = inject(VinService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
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
  debitAccounts = signal<AccountNode[]>([]);
  creditAccounts = signal<AccountNode[]>([]);
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
    const filter = this.supplierFilterSignal()?.toLowerCase() || '';
    return this.suppliers().filter(s =>
      s.name?.toLowerCase().includes(filter) ?? false
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

  // Invoice number computed signal
  invoiceNumber = computed(() => `PO-${Date.now()}`);

  // Edit mode signals
  isEditMode = signal(false);
  currentInvoiceId = signal<number | null>(null);
  invoiceNumberSignal = signal<string>('');

  // Reactive Form
  purchaseInvoiceForm!: FormGroup;

  // Table columns for Material table
  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'lineTotal', 'actions'];

  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);

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
  
  totalAmount = computed(() => Math.round(this.subtotal() + this.vatAmount()));

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
    // Check if we're editing an existing invoice
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.isEditMode.set(true);
      this.currentInvoiceId.set(+invoiceId);
      this.loadInvoiceForEdit(+invoiceId);
    }
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

    // Initialize form if not editing
    const invoiceId = this.route.snapshot.params['id'];
    if (!invoiceId) {
      this.initForm();
    }

    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });

    // Load accounts
    this.loadAccounts();
  }

  /**
   * Get the translated title for the invoice
   */
  getTitle(): string {
    return this.customTitle ?  this.translate.instant('PURCHASE_INVOICE.CREATE_TITLE'):this.translate.instant("PURCHASE_INVOICE.CASH_INVOICE_TITLE");
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
   * Handle payment method locking based on input properties
   */
  private handlePaymentMethodLocking(): void {
    if (this.purchaseInvoiceForm && this.lockPaymentMethod && this.fixedPaymentMethod) {
      // Set the payment method value
      this.purchaseInvoiceForm.patchValue({
        paymentType: this.fixedPaymentMethod
      });

      // Update signal
      this.paymentMethodSignal.set(this.fixedPaymentMethod);

      // Disable the payment method control
      const paymentMethodControl = this.purchaseInvoiceForm.get('paymentMethod');
      if (paymentMethodControl) {
        paymentMethodControl.disable();
      }
    }
  }



  /**
   * Handle payment method locking based on input properties
   */
 
  private loadAccounts(): void {
    // Load debit accounts (inventory/expense)
    this.accountingService.getAccountsByCategory('debit').subscribe(accounts => {
      this.debitAccounts.set(accounts);
      console.log('Debit accounts loaded', accounts);
    });

    // Load credit accounts (supplier/cash/bank)
    this.accountingService.getAccountsByCategory('credit').subscribe(accounts => {
      this.creditAccounts.set(accounts);
      console.log('Credit accounts loaded', accounts);
    });
  }

  private initForm(): void {
    this.purchaseInvoiceForm = this.fb.group({
      supplierId: [null, Validators.required],
      debitAccountId: [null, Validators.required],
      creditAccountId: [null, Validators.required],
      invoiceDate: [new Date(), Validators.required],
      paymentMethod: ['cash' , Validators.required],
      paymentType: [this.fixedPaymentMethod || 'Bank Transfer'],
      dueDate: [null], // Optional, required only for credit invoices
      invoiceType: [InvoiceType.Taxable, Validators.required],
      ClassificationId: [0, Validators.required],
      notes: ['']
    }, { validators: [this.accountValidator, this.dueDateValidator] });

    // Set payment method signal
    this.paymentMethodSignal.set(this.fixedPaymentMethod || 'Bank Transfer');

    // Set initial invoice type
    this.invoiceType.set(InvoiceType.Taxable);

    // Generate invoice number
    const newInvoiceNumber = `PO-${Date.now()}`;
    this.invoiceNumberSignal.set(newInvoiceNumber);
    this.purchaseInvoiceForm.patchValue({
      invoiceNumber: newInvoiceNumber
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

  private dueDateValidator(group: AbstractControl): { [key: string]: any } | null {
    const paymentMethod = group.get('paymentMethod')?.value;
    const dueDate = group.get('dueDate')?.value;

    if (paymentMethod === 'Credit (Deferred)' && !dueDate) {
      return { dueDateRequired: true };
    }

    return null;
  }

  loadInvoiceForEdit(invoiceId: number): void {
    this.procurementService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Initialize form with existing invoice data
        this.purchaseInvoiceForm = this.fb.group({
          supplierId: [invoice.supplierId, Validators.required],
          debitAccountId: [invoice.debitAccountId, Validators.required],
          creditAccountId: [invoice.creditAccountId, Validators.required],
          invoiceDate: [new Date(invoice.invoiceDate), Validators.required],
          paymentMethod: [invoice.paymentMethod || 'Bank Transfer'],
          dueDate: [invoice.dueDate ? new Date(invoice.dueDate) : null],
          invoiceType: [invoice.invoiceType || InvoiceType.Taxable, Validators.required],
          ClassificationId: [invoice.ClassificationId || 0, Validators.required],
          notes: [invoice.notes || ''],
        }, { validators: [this.accountValidator, this.dueDateValidator] });

        // Set invoice number
        this.invoiceNumberSignal.set(invoice.invoiceNumber);

        // Set invoice type signal
        this.invoiceType.set((invoice.invoiceType as InvoiceType) || InvoiceType.Taxable);

        // Set invoice items
        this.invoiceItems.set(invoice.items || []);
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
      carDescription: `${car.make} ${car.model} (${car.year})`,
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
  addCarToPurchase(car: any): void {
    // Check if already exists
    const alreadyExists = this.invoiceItems().some(item => item.carId === car.id);
    if (alreadyExists) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    // Create invoice item with default quantity of 1
    const newItem: InvoiceItem = {
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
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
      data: {}
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
      this.notificationService.showError('Please fill all required fields correctly');
      return;
    }

    const formValue = this.purchaseInvoiceForm.value;
    const supplierId = formValue.supplierId;
    const supplier = this.suppliers().find(s => s.id === supplierId);
    const items = this.invoiceItems();

    if (!supplierId || !supplier) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_SELECT_SUPPLIER');
      return;
    }
    if (items.length === 0) {
      this.notificationService.showError('PURCHASE_INVOICE.ERROR_NO_ITEMS');
      return;
    }
    if (this.totalAmount() <= 0) {
      this.notificationService.showError('Total amount must be greater than 0');
      return;
    }

    const newInvoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'> = {
      invoiceNumber: this.invoiceNumberSignal(), // Use the signal value
      invoiceDate: formValue.invoiceDate.toISOString(),
      supplierId: supplierId,
      debitAccountId: formValue.debitAccountId,
      creditAccountId: formValue.creditAccountId,
      paymentType: formValue.paymentType,
      paymentMethod: formValue.paymentMethod,
      dueDate: formValue.dueDate ? formValue.dueDate.toISOString() : undefined,
      ClassificationId: parseInt(formValue.ClassificationId),
      invoiceType: formValue.invoiceType,
      items: items,
      totalAmount: this.totalAmount(),
      notes: formValue.notes,
      status: 'Unpaid',
      isArchived: false
    };

    if (this.isEditMode()) {
      const invoiceId = this.currentInvoiceId();
      if (!invoiceId) {
        this.notificationService.showError('Invalid invoice ID for update');
        return;
      }
      this.procurementService.updateInvoice(invoiceId, newInvoice).subscribe({
        next: (savedInvoice) => {
          this.notificationService.showSuccess('TOAST.UPDATE_SUCCESS');
          // Optionally navigate or reset
        },
        error: (error) => {
          console.error('Error updating purchase invoice:', error);
          this.notificationService.showError('TOAST.SAVE_ERROR');
        }
      });
    } else {
      this.procurementService.addInvoice(newInvoice).subscribe({
        next: (savedInvoice) => {
            this.notificationService.showSuccess('TOAST.ADD_SUCCESS');
        },
        error: (error) => {
          console.error('Error saving purchase invoice:', error);
          this.notificationService.showError('TOAST.SAVE_ERROR');
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
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.vins) {
        // Update the item with the VIN numbers
        const vinNumbers = result.vins.map((v: VinEntry) => v.vin);
        const updatedItem = { ...item, vinNumbers };
        this.updateInvoiceItem(updatedItem);
        this.notificationService.showSuccess('VIN numbers updated successfully');
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
