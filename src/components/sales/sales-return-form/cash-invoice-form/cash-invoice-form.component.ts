import { AccountingService } from '@/src/components/accounting/accounting.service';
import { CurrentSettingService } from '@/src/services/current-setting.service';
import { CustomerService } from '@/src/services/customer.service';
import { InventoryService } from '@/src/services/inventory.service';
import { InvoiceIntegrationService } from '@/src/services/invoice-integration.service';
import { SalesReturnService } from '@/src/services/sales-return.service';
import { SalesService } from '@/src/services/sales.service';
import { StoreService } from '@/src/services/store.service';
import { ToastService } from '@/src/services/toast.service';
import { Customer } from '@/src/types/customer.model';
import { InvoiceItem } from '@/src/types/invoice-item.model';
import { ReturnInvoiceItem } from '@/src/types/return-invoice-item.model';
import { SalesInvoice } from '@/src/types/sales-invoice.model';
import { SalesReturn } from '@/src/types/sales-return.model';
import { StoreCarStockDto } from '@/src/types/store-car-stock.model';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { CarSelectionDialogComponent } from '../../car-selection-dialog/car-selection-dialog.component';
import { InvoiceItemDialogComponent } from '../../invoice-item-dialog/invoice-item-dialog.component';
import { SalesReturnFormComponent } from "../sales-return-form.component";
const VAT_RATE_FULL = 0.15; // 15% for new cars on full sale price
const VAT_RATE_MARGIN = 0.15; // 15% applied to profit margin for used cars

@Component({
  selector: 'app-cash-invoice-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule, DxDataGridModule, DxButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatButtonModule, MatCheckboxModule, MatDatepickerModule, SalesReturnFormComponent],
  templateUrl: './cash-invoice-form.component.html',
  styleUrl: './cash-invoice-form.component.css'
})
export class CashInvoiceFormComponent {
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
         dueDate: new FormControl(''),
         paymentMethod: new FormControl('Cash'),
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
 
     // Watch for customer changes to set payment method
     this.invoiceForm.get('customer')?.valueChanges.subscribe(customerId => {
       const customer = this.customers().find(c => c.id === customerId);
       this.selectedCustomer.set(customer || null);
       if (customer?.isCreditCustomer) {
         this.invoiceForm.get('paymentMethod')?.setValue('Finance');
       } else {
         this.invoiceForm.get('paymentMethod')?.setValue('Cash');
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
           dueDate: new FormControl(invoice.dueDate ? new Date(invoice.dueDate) : ''),
           paymentMethod: new FormControl(invoice.paymentMethod || 'Cash'),
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
         carName: car.carName,
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
           carDescription: car.carName,
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
     const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
       width: '800px',
       data: { cars: this.carCards() }
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
 