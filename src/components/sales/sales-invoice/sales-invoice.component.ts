import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';

const VAT_RATE = 0.15; // 15%

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
    return cars.filter(car => quantities.get(car.id) && quantities.get(car.id)! > 0);
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
  vatAmount = computed(() => this.subtotal() * VAT_RATE);
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

    const newInvoice: Omit<SalesInvoice, 'id' | 'amountPaid' | 'amountDue'> = {
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