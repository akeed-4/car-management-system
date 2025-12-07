import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { CustomerService } from '../../../services/customer.service';
import { SalesService } from '../../../services/sales.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { InvoiceItem } from '../../../types/invoice-item.model';
import { Car } from '../../../types/car.model';
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

const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

@Component({
  selector: 'app-sales-invoice',
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
    MatDividerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-invoice.component.html',
  styleUrl: './sales-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceComponent {
  private inventoryService = inject(InventoryService);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private currentSettingService = inject(CurrentSettingService);
  private router = inject(Router);

  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'lineTotal', 'actions'];

  // Layout configuration for responsive grid
  layout$ = this.currentSettingService.getCardLayout(4);

  // Form controls
  customerControl = new FormControl(null, Validators.required);
  invoiceDateControl = new FormControl(new Date().toISOString().split('T')[0], Validators.required);
  dueDateControl = new FormControl('');
  paymentMethodControl = new FormControl('Cash');
  salespersonControl = new FormControl('');
  selectedCarIdControl = new FormControl(null);
  selectedQuantityControl = new FormControl(1, [Validators.required, Validators.min(1)]);
  notesControl = new FormControl('');

  // Services state
  customers = signal([
    { id: 1, name: 'Customer A', nationalId: '1234567890' },
    { id: 2, name: 'Customer B', nationalId: '0987654321' }
  ]);
  private allCars = signal([
    { id: 1, make: 'Toyota', model: 'Corolla', year: 2022, status: 'Available', condition: 'New', salePrice: 50000, totalCost: 40000 },
  ]);
  carQuantities = signal(new Map([[1, 5], [2, 3]])); // Mock quantities
  availableCars = computed(() => {
    const cars = this.allCars();
    const quantities = this.carQuantities();
    // Filter out cars that are 'Sold' or 'In Maintenance'
    return cars.filter(car => 
      (car.status === 'Available' || car.status === 'Reserved') && 
      (quantities.get(car.id) && quantities.get(car.id)! > 0)
    );
  });

  // Invoice items state
  invoiceItems = signal<InvoiceItem[]>([]);

  invoiceNumber = signal('');

  constructor() {
    this.invoiceNumber.set(`INV-${Date.now()}`);
    // Add mock data for testing
    this.invoiceItems.set([
      {
        carId: 1,
        carDescription: 'Toyota Corolla 2022',
        quantity: 1,
        unitPrice: 50000,
        lineTotal: 50000
      },
      {
        carId: 2,
        carDescription: 'Honda Civic 2023',
        quantity: 2,
        unitPrice: 60000,
        lineTotal: 120000
      }
    ]);
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
    const carId = this.selectedCarIdControl.value;
    if (!carId) {
      alert('الرجاء اختيار سيارة.');
      return;
    }

    const car = this.allCars().find(c => c.id === carId);
    const quantity = this.selectedQuantityControl.value;
    const availableStock = this.carQuantities().get(carId) || 0;

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
    this.selectedCarIdControl.setValue(null);
    this.selectedQuantityControl.setValue(1);
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
    const customerId = this.customerControl.value;
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

    // Mock save
    alert('تم إنشاء الفاتورة بنجاح.');
    this.router.navigate(['/sales']);
  }
}
