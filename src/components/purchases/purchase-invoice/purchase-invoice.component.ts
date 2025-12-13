
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
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
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
import { Supplier } from '../../../types/supplier.model';
import { StoreCarStockDto } from '../../../types/store-car-stock.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Direction } from '@angular/cdk/bidi';
import { LanguageService } from '@/src/services/language.service';
import { ToastService } from '../../../services/toast.service';

const VAT_RATE = 0.15; // 15% VAT

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
    DxDataGridModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceComponent {
  inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(PurchasesService);
  private currentSettingService = inject(CurrentSettingService);
  private storeService = inject(StoreService);
  private salesService = inject(SalesService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  // Services state
  suppliers = signal<Supplier[]>([]);
  stores = this.storeService.stores$;
  cars = this.inventoryService.cars$; // Use this to select existing car definitions
  carStocks = signal<StoreCarStockDto[]>([]);
  textDir: Direction = this.languageService.getCurrentLanguage() == 'en' ? 'ltr' : 'rtl';
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

  constructor() {
    // Check if we're editing an existing invoice
    const invoiceId = this.route.snapshot.params['id'];
    if (invoiceId) {
      this.loadInvoiceForEdit(+invoiceId);
    } else {
      this.initForm();
    }

    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });
  }

  private initForm(): void {
    this.purchaseInvoiceForm = this.fb.group({
      supplierId: [null, Validators.required],
      storeId: [null, Validators.required],
      invoiceDate: [new Date(), Validators.required],
      paymentMethod: ['Bank Transfer'],
      notes: ['']
    });

    // Generate invoice number
    this.purchaseInvoiceForm.patchValue({
      invoiceNumber: `PO-${Date.now()}`
    });
  }

  loadInvoiceForEdit(invoiceId: number) {
    this.procurementService.getInvoiceById(invoiceId).subscribe({
      next: (invoice) => {
        // Initialize form with existing invoice data
        this.purchaseInvoiceForm = this.fb.group({
          supplierId: [invoice.supplierId, Validators.required],
          storeId: [invoice.storeId, Validators.required],
          invoiceDate: [new Date(invoice.invoiceDate), Validators.required],
          paymentMethod: [invoice.paymentMethod || 'Bank Transfer'],
          notes: [invoice.notes || ''],
          invoiceNumber: [invoice.invoiceNumber]
        });

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

  // Computed properties
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  vatAmount = computed(() => this.subtotal() * VAT_RATE);
  totalAmount = computed(() => this.subtotal() + this.vatAmount());

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
    if(carId) {
        this.inventoryService.getCarById(carId).subscribe(car => {
          this.purchasePrice.set(car?.purchasePrice ?? 0);
          this.selectedCar.set(car);
        });
    } else {
      this.purchasePrice.set(0);
      this.selectedCar.set(null);
    }
  }

  saveInvoice(): void {
    if (this.purchaseInvoiceForm.invalid) {
      alert('الرجاء إكمال جميع الحقول المطلوبة.');
      return;
    }

    const formValue = this.purchaseInvoiceForm.value;
    const supplierId = formValue.supplierId;
    const supplier = this.suppliers().find(s => s.id === supplierId);
    const items = this.invoiceItems();

    if (!supplierId || !supplier) {
      alert('الرجاء اختيار المورد.');
      return;
    }
    if (items.length === 0) {
      alert('الرجاء إضافة سيارة واحدة على الأقل للفاتورة.');
      return;
    }

    const newInvoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue'> = {
        invoiceNumber: `PO-${Date.now()}`, // Generate new invoice number
        invoiceDate: formValue.invoiceDate,
        supplierId: supplierId,
        supplierName: supplier.name,
        storeId: formValue.storeId,
        paymentMethod: formValue.paymentMethod,
        items: items,
        totalAmount: this.totalAmount(),
        notes: formValue.notes,
        status: 'Unpaid', // Default status
    };

    this.procurementService.addInvoice(newInvoice).subscribe({
      next: (savedInvoice) => {
        // Update inventory for each purchased item
        items.forEach(item => {
          this.inventoryService.incrementCarQuantity(item.carId, item.quantity);
        });

        this.toastService.showSuccess('TOAST.ADD_SUCCESS');
        // this.router.navigate(['/purchases']);
      },
      error: (error) => {
        console.error('Error saving purchase invoice:', error);
        this.toastService.showError('TOAST.SAVE_ERROR');
      }
    });
  }
}
