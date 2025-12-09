
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { SupplierService } from '../../../services/supplier.service';
import { ProcurementService } from '../../../services/procurement.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-invoice',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, TranslateModule],
  templateUrl: './purchase-invoice.component.html',
  styleUrl: './purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseInvoiceComponent {
  private inventoryService = inject(InventoryService);
  private supplierService = inject(SupplierService);
  private procurementService = inject(ProcurementService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Services state
  suppliers = toSignal(this.supplierService.getSuppliers(), { initialValue: [] });
  cars = this.inventoryService.cars$; // Use this to select existing car definitions

  // Form state
  invoiceNumber = signal(''); // Added for consistency with SalesInvoice
  invoiceDate = signal(new Date().toISOString().split('T')[0]);
  selectedSupplierId = signal<number | null>(null);
  paymentMethod = signal<'Cash' | 'Bank Transfer'>('Bank Transfer');
  notes = signal('');
  
  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);
  
  // Temp state for adding a new item
  selectedCarId = signal<number | null>(null);
  selectedQuantity = signal(1);
  purchasePrice = signal(0);
  selectedCar = signal<Car | null>(null);

  constructor() {
    this.invoiceNumber.set(`PO-${Date.now()}`); // Generate Purchase Order number
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
  }  saveInvoice(): void {
    const supplierId = this.selectedSupplierId();
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
        invoiceNumber: this.invoiceNumber(), // Include invoice number
        invoiceDate: this.invoiceDate(),
        supplierId: supplierId,
        supplierName: supplier.name,
        paymentMethod: this.paymentMethod(),
        items: items,
        totalAmount: this.totalAmount(),
        notes: this.notes(),
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
