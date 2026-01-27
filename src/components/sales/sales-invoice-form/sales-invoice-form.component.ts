import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { StoreService } from '../../../services/store.service';
import { AccountingService } from '../../accounting/accounting.service';
import { SalesInvoice } from '../../../models/sales-invoice.model';
import { InvoiceItem } from '../../../models/invoice-item.model';
import { Car } from '../../../models/car.model';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { Customer } from '../../../models/customer.model';
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
import { ToastService } from '../../../services/toast.service';

const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

export enum InvoiceType {
  Taxable = 'Taxable',
  ZeroRated = 'Zero Rated',
  Exempt = 'Exempt'
}

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
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-invoice-form.component.html',
  styleUrl: './sales-invoice-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceFormComponent implements OnInit {
    @Input() lockPaymentMethod: boolean = false;
    @Input() fixedPaymentMethod: any;
    @Input() customTitle:any;
    @Input() isCash: boolean = false;
    // Expose enum to template
    InvoiceType = InvoiceType;
    // Utility to calculate total amount
    calculateTotalAmount(items: any[]): number {
      return items.reduce((sum, item) => sum + (item.amount || 0), 0);
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

  invoiceNumber = signal('');
  isEditMode = signal(false);
  currentInvoiceId = signal<number | null>(null);
  selectedCustomer = signal<Customer | null>(null);

  // Invoice type signal
  invoiceType = signal<InvoiceType>(InvoiceType.Taxable);

  // Invoice classification signals
  invoiceClassifications = signal<any[]>([]);
  selectedInvoiceClassification = signal<any | null>(null);

  // Account signals
  debitAccounts = signal<any[]>([]);
  creditAccounts = signal<any[]>([]);

  constructor(
    private inventoryService: InventoryService,
    private customerService: CustomerService,
    private salesService: SalesService,
    private currentSettingService: CurrentSettingService,
    private storeService: StoreService,
    private accountingService: AccountingService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.invoiceNumber.set(`INV-${Date.now()}`);
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
        selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)])
      });
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

 

    // Watch for customer changes to set payment method
    this.invoiceForm.get('customer')?.valueChanges.subscribe(customerId => {
      const customer = this.customers().find(c => c.id === customerId);
      this.selectedCustomer.set(customer || null);
      // Set payment method based on isCash input
      this.invoiceForm.get('paymentMethod')?.setValue(this.isCash ? 'Cash' : 'Credit');
    });
  }

  loadInvoiceForEdit(invoiceId: number) {
    this.salesService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Set isCash based on invoice data (for backward compatibility, derive from paymentMethod if isCash not set)
        if (invoice.isCash !== undefined) {
          (this as any).isCash = invoice.isCash;
        } else {
          // Derive from payment method for existing invoices
          (this as any).isCash = invoice.paymentMethod === 'Cash';
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
          selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)])
        });

        // Set invoice number and items
        this.invoiceNumber.set(invoice.invoiceNumber);
        this.invoiceItems.set(invoice.items || []);
      },
      error: (error) => {
        console.error('Failed to load invoice for edit', error);
        // Navigate back to sales list on error
        this.router.navigate(['/sales']);
      }
    });
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
    addCarToSales(car: any): void {
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
      salesPrice: car.salesPrice || 0,
      lineTotal: (car.salesPrice || 0) * 1,
    };

    // Add to invoice items
    this.invoiceItems.update(items => [...items, newItem]);
  }

  // Computed properties for calculations
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  
  vatAmount = computed(() => {
    return this.subtotal() * VAT_RATE_FULL;
  });

  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  hasInstallments = computed(() => {
    return this.invoiceItems().some(item => item.installmentDetails);
  });

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
          this.toastService.showError('INVOICE.ALREADY_ADDED');
          return;
        }

        // Check quantity
        if (quantity > car.availableQuantity) {
          this.toastService.showError('INVOICE.INSUFFICIENT_STOCK');
          return;
        }

        // Create invoice item
        const newItem: InvoiceItem = {
          carId: car.carId,
          carName: car.carName,
          carDescription: `${car.make} ${car.model} (${car.year})`,
          quantity,
          unitPrice,
          lineTotal: unitPrice * quantity,
          carImage: car.imageUrl
        };

        // Add to invoice items
        this.invoiceItems.update(items => [...items, newItem]);
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
    carId: stockItem.carId,
    carName: stockItem.carName,
    carDescription: stockItem.carName,
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
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

  
  removeItem(carId: number): void {
    this.invoiceItems.update(items => items.filter(item => item.carId !== carId));
  }
  
  updateItemPrice(carId: number, newPrice: number): void {
    this.invoiceItems.update(items =>
      items.map(item =>
        item.carId === carId
          ? { ...item, unitPrice: newPrice, lineTotal: newPrice * item.quantity }
          : item
      )
    );
  }


  saveInvoice(): void {
    const storeId = this.invoiceForm.get('storeId')?.value;
    const customerId = this.invoiceForm.get('customer')?.value;
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
    const invoiceData: SalesInvoice = {
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
      items: items,
      subtotal: this.subtotal(),
      totalAmount: this.totalAmount(),
      vatAmount: this.vatAmount(),
      notes: this.invoiceForm.get('notes')?.value || '',
      isArchived: false,
      status: "Pending",
      amountPaid: 0,
      amountDue: this.totalAmount(),
      ownershipTransferStatus: 'Not Started',
    };

    if (this.isEditMode()) {
      this.salesService.updateInvoice(invoiceData).subscribe({
        next: () => {
          this.toastService.showSuccess('TOAST.UPDATE_SUCCESS');
        },
        error: () => {
          this.toastService.showError('TOAST.SAVE_ERROR');
        }
      });
    } else {
      this.salesService.addInvoice(invoiceData).subscribe({
        next: () => {
          this.toastService.showSuccess('TOAST.ADD_SUCCESS');
          this.router.navigate(['/sales']);
        },
        error: () => {
          this.toastService.showError('TOAST.SAVE_ERROR');
        }
      });
    }
  }
}
