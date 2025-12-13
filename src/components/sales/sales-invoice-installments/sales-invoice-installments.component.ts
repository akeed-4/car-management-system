import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators, FormGroup, FormArray, FormBuilder } from '@angular/forms';
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
import { Customer } from '../../../types/customer.model';
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
import { ToastService } from '../../../services/toast.service';

const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

@Component({
  selector: 'app-sales-invoice-installments',
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
  templateUrl: './sales-invoice-installments.component.html',
  styleUrl: './sales-invoice-installments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceInstallmentsComponent implements OnInit {
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

  selectedCustomer = signal<Customer | null>(null);

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
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    this.invoiceNumber.set(`INV-${Date.now()}`);
  }

  ngOnInit() {
    // Check if we're editing an existing invoice
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.loadInvoiceForEdit(+invoiceId);
    } else {
      // Initialize form group for new installment invoice
      this.invoiceForm = new FormGroup({
        store: new FormControl(null, Validators.required),
        customer: new FormControl(null, Validators.required),
        invoiceDate: new FormControl(new Date(), Validators.required),
        dueDate: new FormControl(''),
        paymentMethod: new FormControl('Installments'),
        salesperson: new FormControl(''),
        selectedCarId: new FormControl(null),
        selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
        notes: new FormControl(''),
        selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
        // Installment specific fields
        downPayment: new FormControl(0, [Validators.required, Validators.min(0)]),
        installments: new FormArray([])
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

    // Watch for customer changes to set payment method
    this.invoiceForm.get('customer')?.valueChanges.subscribe(customerId => {
      const customer = this.customers().find(c => c.id === customerId);
      this.selectedCustomer.set(customer || null);
    });
  }

  // Getters for installment form controls
  get installments(): FormArray {
    return this.invoiceForm.get('installments') as FormArray;
  }

  get downPayment(): FormControl {
    return this.invoiceForm.get('downPayment') as FormControl;
  }

  // Methods for managing invoice items
  addItemToInvoice(): void {
    const customerId = this.invoiceForm.get('customer')?.value;
    const carId = this.invoiceForm.get('selectedCarId')?.value;
    const quantity = this.invoiceForm.get('selectedQuantity')?.value;
    const unitPrice = this.invoiceForm.get('selectedCostPrice')?.value;

    // ---- 1. Validate form selections ----
    if (!customerId) {
      this.toastService.showError(this.translate.instant('INVOICE.SELECT_CUSTOMER'));
      return;
    }

    if (!carId) {
      this.toastService.showError(this.translate.instant('INVOICE.SELECT_CAR'));
      return;
    }

    if (!quantity || quantity <= 0) {
      this.toastService.showError(this.translate.instant('INVOICE.INVALID_QUANTITY'));
      return;
    }

    if (!unitPrice || unitPrice <= 0) {
      this.toastService.showError(this.translate.instant('INVOICE.INVALID_PRICE'));
      return;
    }

    // ---- 2. Get stock item ----
    const stockItem = this.carStocks().find(c => c.carId === carId);

    if (!stockItem) {
      this.toastService.showError(this.translate.instant('INVOICE.CAR_NOT_FOUND'));
      return;
    }

    if (quantity > stockItem.availableQuantity) {
      this.toastService.showError(
        `${this.translate.instant('INVOICE.QUANTITY')} (${quantity}) ` +
        `${this.translate.instant('COMMON.STOCK_LESS')} (${stockItem.availableQuantity}).`
      );
      return;
    }

    // ---- 3. Check if already exists ----
    const alreadyExists = this.invoiceItems().some(item => item.carId === carId);
    if (alreadyExists) {
      this.toastService.showError(this.translate.instant('INVOICE.ALREADY_ADDED'));
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

  // Installment management methods
  addInstallment(): void {
    const installmentGroup = this.fb.group({
      amount: [0, [Validators.required, Validators.min(0)]],
      date: ['', Validators.required],
    });
    this.installments.push(installmentGroup);
  }

  removeInstallment(index: number): void {
    this.installments.removeAt(index);
  }

  calculateTotalInstallments(): number {
    return this.installments.controls.reduce((total, control) => {
      const amount = control.get('amount')?.value || 0;
      return total + amount;
    }, 0);
  }

  // Invoice calculations
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));

  vatAmount = computed(() => {
    // Apply VAT based on car type - simplified logic
    return this.subtotal() * VAT_RATE_FULL;
  });

  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  totalWithDownPayment = computed(() => this.totalAmount() - this.downPayment.value);

  // Form submission
  saveInvoice(): void {
    if (this.invoiceForm.valid && this.invoiceItems().length > 0) {
      const invoiceData = {
        ...this.invoiceForm.value,
        invoiceItems: this.invoiceItems(),
        subtotal: this.subtotal(),
        vatAmount: this.vatAmount(),
        totalAmount: this.totalAmount(),
        installmentSchedule: {
          downPayment: this.downPayment.value,
          installments: this.installments.value,
          totalInstallmentAmount: this.calculateTotalInstallments()
        }
      };

      console.log('Installment Invoice Data:', invoiceData);
      this.toastService.showSuccess(this.translate.instant('INVOICE.CREATED_SUCCESS'));

      // Navigate back to sales
      this.router.navigate(['/sales']);
    } else {
      if (this.invoiceItems().length === 0) {
        this.toastService.showError(this.translate.instant('INVOICE.ADD_AT_LEAST_ONE'));
      }
      this.invoiceForm.markAllAsTouched();
    }
  }

  // Helper methods
  loadCarStocks(storeId: number): void {
    // Mock data - replace with actual service call
    this.carStocks.set([
      {
        id: 1,
        storeId: storeId,
        storeName: 'Main Store',
        carId: 1,
        carName: 'Toyota Corolla 2022',
        carDescription: 'Toyota Corolla 2022',
        availableQuantity: 5,
        quantity: 10,
        reservedQuantity: 5,
        lastUpdatedAt: new Date().toISOString()
      },
      {
        id: 2,
        storeId: storeId,
        storeName: 'Main Store',
        carId: 2,
        carName: 'Honda Civic 2021',
        carDescription: 'Honda Civic 2021',
        availableQuantity: 3,
        quantity: 8,
        reservedQuantity: 5,
        lastUpdatedAt: new Date().toISOString()
      }
    ]);
    this.availableCars.set(this.carStocks());
  }

  loadInvoiceForEdit(invoiceId: number): void {
    // Implement edit functionality
    console.log('Loading invoice for edit:', invoiceId);
  }
}