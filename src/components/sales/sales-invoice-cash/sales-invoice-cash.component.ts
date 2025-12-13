import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
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
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
import { StoreCarStockDto } from '../../../types/store-car-stock.model';
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
import { DxoValueErrorBarComponent } from 'devextreme-angular/ui/nested';
import { ToastService } from '../../../services/toast.service';

const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

@Component({
  selector: 'app-sales-invoice-cash',
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
  templateUrl: './sales-invoice-cash.component.html',
  styleUrl: './sales-invoice-cash.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceCashComponent implements OnInit {
    // Utility to calculate total amount
    calculateTotalAmount(items: any[]): number {
      return items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'lineTotal', 'actions'];

  // Layout configuration for responsive grid
  layout$ = this.currentSettingService.getCardLayout(4);

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

  constructor(
    private inventoryService: InventoryService,
    private customerService: CustomerService,
    private salesService: SalesService,
    private currentSettingService: CurrentSettingService,
    private storeService: StoreService,
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
      this.loadInvoiceForEdit(+invoiceId);
    } else {
      // Initialize form group for new invoice
      this.invoiceForm = new FormGroup({
        store: new FormControl(null, Validators.required),
        customer: new FormControl(null, Validators.required),
        invoiceDate: new FormControl(new Date(), Validators.required),
        salesperson: new FormControl(''),
        selectedCarId: new FormControl(null),
        selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
        notes: new FormControl(''),
        selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)])
      });
    }

    // Watch for store changes to load car stocks
    this.invoiceForm.get('store')?.valueChanges.subscribe(storeId => {
      if (storeId) {
        this.loadCarStocks(storeId);
      } else {
        this.carStocks.set([]);
      }
    });
  }

  loadInvoiceForEdit(invoiceId: number) {
    this.salesService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Initialize form group with existing invoice data
        this.invoiceForm = new FormGroup({
          store: new FormControl(invoice.storeId, Validators.required),
          customer: new FormControl(invoice.customerId, Validators.required),
          invoiceDate: new FormControl(new Date(invoice.invoiceDate), Validators.required),
          salesperson: new FormControl(invoice.salesperson || ''),
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

  // Computed properties for calculations
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  
  vatAmount = computed(() => {
    return this.subtotal() * VAT_RATE_FULL;
  });

  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  // Methods for managing invoice items
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
    const storeId = this.invoiceForm.get('store')?.value;
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
    const now = new Date();
    const invoiceData: SalesInvoice = {
      id: 0, // Placeholder, backend should assign
      invoiceNumber: 'INV-' + now.getTime(),
      invoiceDate: now.toISOString(),
      customerId,
      customerName: customer.name,
      storeId,
      items,
      subtotal: this.subtotal(),
      totalAmount: this.totalAmount(),
      vatAmount: this.vatAmount(),
      notes: this.invoiceForm.get('notes')?.value || '',
      isArchived: false,
      status: "Pending",
      amountPaid: 0,
      amountDue: this.totalAmount(),
      ownershipTransferStatus: 'Not Started',
      paymentMethod: 'Cash'
    };

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