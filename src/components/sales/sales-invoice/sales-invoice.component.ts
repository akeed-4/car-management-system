
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';

const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

@Component({
  selector: 'app-sales-invoice',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe],
  templateUrl: './sales-invoice.component.html',
  styleUrl: './sales-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceComponent {
  private inventoryService = inject(InventoryService);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private router = inject(Router);

  // Services state
  customers = this.customerService.customers$;
  private allCars = this.inventoryService.cars$;
  carQuantities = this.inventoryService.carQuantities$; // Access car quantities
  availableCars = computed(() => {
    const cars = this.allCars();
    const quantities = this.carQuantities();
    // Filter out cars that are 'Sold' or 'In Maintenance'
    return cars.filter(car => 
      (car.status === 'Available' || car.status === 'Reserved') && 
      (quantities.get(car.id) && quantities.get(car.id)! > 0)
    );
  });

  // Form state - Header
  invoiceNumber = signal('');
  invoiceDate = signal(new Date().toISOString().split('T')[0]);
  dueDate = signal('');
  selectedCustomerId = signal<number | null>(null);
  paymentMethod = signal<'Cash' | 'Bank Transfer' | 'Finance'>('Cash');
  salesperson = signal('');
  notes = signal('');
  
  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);
  
  // Temp state for adding a new item
  selectedCarId = signal<number | null>(null);
  selectedQuantity = signal(1);

  constructor() {
    this.invoiceNumber.set(`INV-${Date.now()}`);
  }

  // Computed properties for calculations
  subtotal = computed(() => this.invoiceItems().reduce((sum, item) => sum + item.lineTotal, 0));
  
  vatAmount = computed(() => {
    let totalVat = 0;
    const carsMap = new Map(this.allCars().map(c => [c.id, c]));

    for (const item of this.invoiceItems()) {
      const car = carsMap.get(item.carId);
      if (car) {
        if (car.condition === 'Used') {
          // Margin VAT: VAT on (Sale Price - Cost)
          // Ensure totalCost is accurate from inventory service (includes purchasePrice + additionalCosts + linked expenses)
          const profitMargin = item.unitPrice - car.totalCost; 
          totalVat += Math.max(0, profitMargin) * VAT_RATE_MARGIN * item.quantity;
        } else {
          // Full VAT: VAT on Sale Price
          totalVat += item.unitPrice * VAT_RATE_FULL * item.quantity;
        }
      }
    }
    return totalVat;
  });

  totalAmount = computed(() => this.subtotal() + this.vatAmount());

  // Methods for managing invoice items
  addItemToInvoice(): void {
    const carId = this.selectedCarId();
    if (!carId) {
      alert('الرجاء اختيار سيارة.');
      return;
    }

    const car = this.inventoryService.getCarById(carId);
    const quantity = this.selectedQuantity();
    const availableStock = this.inventoryService.getCarQuantity(carId);


    if (!car || quantity <= 0) {
      return;
    }

    if (quantity > availableStock) {
      alert(`الكمية المطلوبة (${quantity}) أكبر من الكمية المتاحة في المخزون (${availableStock}).`);
      return;
    }
    
    // Check if car is already in the invoice
    const existingItem = this.invoiceItems().find(item => item.carId === carId);
    if (existingItem) {
        alert('هذه السيارة مضافة بالفعل إلى الفاتورة.');
        return;
    }

    const newItem: InvoiceItem = {
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
      quantity: quantity,
      unitPrice: car.salePrice,
      lineTotal: car.salePrice * quantity,
    };

    this.invoiceItems.update(items => [...items, newItem]);

    // Reset selection
    this.selectedCarId.set(null);
    this.selectedQuantity.set(1);
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
    const customerId = this.selectedCustomerId();
    const customer = this.customers().find(c => c.id === customerId);
    const items = this.invoiceItems();

    if (!customerId || !customer) {
      alert('الرجاء اختيار العميل.');
      return;
    }
    if (items.length === 0) {
      alert('الرجاء إضافة سيارة واحدة على الأقل للفاتورة.');
      return;
    }

    // Fix: Add 'ownershipTransferStatus' to the Omit type to match the service method signature.
    const newInvoice: Omit<SalesInvoice, 'id' | 'amountPaid' | 'amountDue' | 'ownershipTransferStatus'> = {
      invoiceNumber: this.invoiceNumber(),
      invoiceDate: this.invoiceDate(),
      dueDate: this.dueDate(),
      customerId: customerId,
      customerName: customer.name,
      salesperson: this.salesperson(),
      paymentMethod: this.paymentMethod(),
      items: items,
      subtotal: this.subtotal(),
      vatAmount: this.vatAmount(),
      totalAmount: this.totalAmount(),
      notes: this.notes(),
      status: 'Pending', // Default status, will be 'Paid' if full payment applied
    };
    
    this.salesService.addInvoice(newInvoice);

    // Update inventory for each item sold
    items.forEach(item => {
      this.inventoryService.decrementCarQuantity(item.carId, item.quantity);
    });
    
    alert('تم إنشاء الفاتورة بنجاح وتحديث المخزون.');
    this.router.navigate(['/sales']);
  }
}
