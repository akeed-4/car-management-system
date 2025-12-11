import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators, FormGroup } from '@angular/forms';
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
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { InvoiceItemDialogComponent } from '../invoice-item-dialog/invoice-item-dialog.component';

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
    MatDividerModule,
    DxDataGridModule,
    TranslateModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './sales-invoice.component.html',
  styleUrl: './sales-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceComponent implements OnInit {
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
  customers = signal([
    { id: 1, name: 'Customer A', nationalId: '1234567890' },
    { id: 2, name: 'Customer B', nationalId: '0987654321' }
  ]);
  private allCars = signal([
    { id: 1, make: 'Toyota', model: 'Corolla', year: 2022, status: 'Available', condition: 'New', salePrice: 50000, totalCost: 40000, photos: ['https://picsum.photos/seed/toyota/800/600'] },
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

  constructor(
   private inventoryService: InventoryService,
    private customerService: CustomerService,
    private salesService: SalesService,
    private currentSettingService: CurrentSettingService,
    private router: Router,
    private translate: TranslateService
    , private dialog: MatDialog
  ) {
    this.invoiceNumber.set(`INV-${Date.now()}`);
  }

  ngOnInit() {
    // Initialize form group
    this.invoiceForm = new FormGroup({
      customer: new FormControl(null, Validators.required),
      invoiceDate: new FormControl(new Date(), Validators.required),
      dueDate: new FormControl(''),
      paymentMethod: new FormControl('Cash'),
      salesperson: new FormControl(''),
      selectedCarId: new FormControl(null),
      selectedQuantity: new FormControl(1, [Validators.required, Validators.min(1)]),
      notes: new FormControl(''),
      selectedCostPrice: new FormControl(0, [Validators.required, Validators.min(0)])
    });
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
    const carId = this.invoiceForm.get('selectedCarId')?.value;
    if (!carId) {
      alert(this.translate.instant('INVOICE.SELECT_CAR'));
      return;
    }

    const car = this.allCars().find(c => c.id === carId);
    const quantity = this.invoiceForm.get('selectedQuantity')?.value;
    const availableStock = this.carQuantities().get(carId) || 0;

    if (!car || quantity <= 0) {
      return;
    }

    if (quantity > availableStock) {
      alert(this.translate.instant('INVOICE.QUANTITY') + ` (${quantity}) ` + this.translate.instant('COMMON.STOCK_LESS') + ` (${availableStock}).`);
      return;
    }
    
    // Check if car is already in the invoice
    const existingItem = this.invoiceItems().find(item => item.carId === carId);
    if (existingItem) {
      alert(this.translate.instant('INVOICE.ALREADY_ADDED'));
      return;
    }

    // Open confirmation dialog before adding
    // const dialogRef = this.dialog.open(InvoiceItemDialogComponent, {
    //   width: '420px',
    //   data: {
    //     carDescription: `${car.make} ${car.model} (${car.year})`,
    //     modelYear: `${car.model} / ${car.year}`,
    //     quantity,
    //     unitPrice: car.salePrice
    //   }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result && result.confirmed) {
    //     const newItem: InvoiceItem = {
    //       carId: car.id,
    //       carDescription: `${car.make} ${car.model} (${car.year})`,
    //       quantity: result.quantity,
    //       unitPrice: result.unitPrice,
    //       lineTotal: result.unitPrice * result.quantity,
    //       carImage: (car.photos && car.photos.length) ? car.photos[0] : null
    //     };

    //     this.invoiceItems.update(items => [...items, newItem]);

    //     // Reset selection
    //     this.invoiceForm.get('selectedCarId')?.setValue(null);
    //     this.invoiceForm.get('selectedQuantity')?.setValue(1);
    //   }
    // });
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
    const customerId = this.invoiceForm.get('customer')?.value;
    const customer = this.customers().find(c => c.id === customerId);
    const items = this.invoiceItems();

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
    };

    this.salesService.addInvoice(invoiceData).subscribe({
      next: () => {
        alert(this.translate.instant('INVOICE.CREATED_SUCCESS'));
        this.router.navigate(['/sales']);
      },
      error: () => {
        alert(this.translate.instant('INVOICE.CREATE_FAILED'));
      }
    });
  }
}
