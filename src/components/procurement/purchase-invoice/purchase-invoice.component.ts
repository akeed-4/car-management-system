
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
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
import { DxDataGridModule } from 'devextreme-angular';
import { InventoryService } from '../../../services/inventory.service';
import { SupplierService } from '../../../services/supplier.service';
import { ProcurementService } from '../../../services/procurement.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
import { Supplier } from '../../../types/supplier.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Direction } from '@angular/cdk/bidi';
import { LanguageService } from '@/src/services/language.service';

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
    DxDataGridModule
  ],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceComponent {
  inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(ProcurementService);
  private currentSettingService = inject(CurrentSettingService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private fb = inject(FormBuilder);

  // Services state
  suppliers = signal<Supplier[]>([]);
  cars = this.inventoryService.cars$; // Use this to select existing car definitions
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
    this.initForm();
    // Load suppliers
    this.supplierService.getSuppliers().subscribe(suppliers => {
      this.suppliers.set(suppliers);
    });
  }

  private initForm(): void {
    this.purchaseInvoiceForm = this.fb.group({
      supplierId: [null, Validators.required],
      invoiceDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentMethod: ['Bank Transfer'],
      notes: ['']
    });

    // Generate invoice number
    this.purchaseInvoiceForm.patchValue({
      invoiceNumber: `PO-${Date.now()}`
    });
  }


  // Computed properties
  totalAmount = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));

  // Methods
  addItemToInvoice(): void {
    const carId = this.selectedCarId();
    if (!carId) {
      alert(this.translate.instant('PROCUREMENT.PURCHASE_INVOICE.ERROR_SELECT_CAR'));
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
      alert(this.translate.instant('PROCUREMENT.PURCHASE_INVOICE.ERROR_ALREADY_ADDED'));
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
        paymentMethod: formValue.paymentMethod,
        items: items,
        totalAmount: this.totalAmount(),
        notes: formValue.notes,
        status: 'Unpaid', // Default status
    };

    this.procurementService.addInvoice(newInvoice);

    // Update inventory for each purchased item
    items.forEach(item => {
      this.inventoryService.incrementCarQuantity(item.carId, item.quantity);
    });

    alert(this.translate.instant('PROCUREMENT.PURCHASE_INVOICE.SAVED_SUCCESS'));
    this.router.navigate(['/purchases']);
  }
}
