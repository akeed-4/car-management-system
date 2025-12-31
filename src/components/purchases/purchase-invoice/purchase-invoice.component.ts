
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
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
import { Supplier } from '../../../types/supplier.model';
import { AccountNode } from '../../../types/account-node.model';
import { StoreCarStockDto } from '../../../types/store-car-stock.model';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../../sales/invoice-item-dialog/invoice-item-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastService } from '@/src/services/toast.service';
import { LanguageService } from '@/src/services/language.service';
import { Direction } from '@angular/cdk/bidi';
import { CarSelectionDialogComponent } from './car-selection-dialog/car-selection-dialog.component';

const VAT_RATE = 0.15; // 15% VAT

import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AccountingService } from '../../accounting/accounting.service';

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
export class PurchaseInvoiceComponent implements OnInit, OnChanges {
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
  @Input() fixedPaymentMethod: string = '';

  /**
   * Input property to set a custom title for the invoice
   * If not provided, uses default title
   */
  @Input() customTitle: string = '';

  inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(PurchasesService);
  private currentSettingService = inject(CurrentSettingService);
  private storeService = inject(StoreService);
  private salesService = inject(SalesService);
  private accountingService = inject(AccountingService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);

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

  // Computed properties
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  vatAmount = computed(() => this.subtotal() * VAT_RATE);
  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  constructor() {
    // Check if we're editing an existing invoice
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.loadInvoiceForEdit(+invoiceId);
    }
  }

  /**
   * Angular lifecycle method - called after component initialization
   */
  ngOnInit(): void {
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
        paymentMethod: this.fixedPaymentMethod
      });

      // Disable the payment method control
      const paymentMethodControl = this.purchaseInvoiceForm.get('paymentMethod');
      if (paymentMethodControl) {
        paymentMethodControl.disable();
      }
    }
  }

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
      paymentMethod: ['Bank Transfer'],
      dueDate: [null], // Optional, required only for credit invoices
      notes: ['']
    }, { validators: [this.accountValidator, this.dueDateValidator] });

    // Generate invoice number
    this.purchaseInvoiceForm.patchValue({
      invoiceNumber: `PO-${Date.now()}`
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
          notes: [invoice.notes || ''],
        }, { validators: [this.accountValidator, this.dueDateValidator] });

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

  removeItem(carId: number): void {
    this.invoiceItems.update(items => items.filter(item => item.carId !== carId));
  }

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
      this.toastService.showError('PURCHASE_INVOICE.ERROR_ALREADY_ADDED');
      return;
    }

    // Create invoice item with default quantity of 1
    const newItem: InvoiceItem = {
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
      quantity: 1,
      unitPrice: car.purchasePrice || 0,
      lineTotal: (car.purchasePrice || 0) * 1,
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

  saveInvoice(): void {
    if (this.purchaseInvoiceForm.invalid) {
      this.toastService.showError('Please fill all required fields correctly');
      return;
    }

    const formValue = this.purchaseInvoiceForm.value;
    const supplierId = formValue.supplierId;
    const supplier = this.suppliers().find(s => s.id === supplierId);
    const items = this.invoiceItems();

    if (!supplierId || !supplier) {
      this.toastService.showError('PURCHASE_INVOICE.ERROR_SELECT_SUPPLIER');
      return;
    }
    if (items.length === 0) {
      this.toastService.showError('PURCHASE_INVOICE.ERROR_NO_ITEMS');
      return;
    }
    if (this.totalAmount() <= 0) {
      this.toastService.showError('Total amount must be greater than 0');
      return;
    }

    const newInvoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'> = {
      invoiceNumber: `PO-${Date.now()}`, // Generate new invoice number
      invoiceDate: formValue.invoiceDate.toISOString(),
      supplierId: supplierId,
      debitAccountId: formValue.debitAccountId,
      creditAccountId: formValue.creditAccountId,
      paymentMethod: formValue.paymentMethod,
      items: items,
      totalAmount: this.totalAmount(),
      notes: formValue.notes,
      status: 'Unpaid',
      isArchived: false
    };

    this.procurementService.addInvoice(newInvoice).subscribe({
      next: (savedInvoice) => {
        // Update inventory for each purchased item
        items.forEach(item => {
          this.inventoryService.incrementCarQuantity(item.carId, item.quantity);
        });

        this.toastService.showSuccess('TOAST.ADD_SUCCESS');
        this.router.navigate(['/purchases']);
      },
      error: (error) => {
        console.error('Error saving purchase invoice:', error);
        this.toastService.showError('TOAST.SAVE_ERROR');
      }
    });
  }
}
