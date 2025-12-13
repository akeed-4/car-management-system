

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../services/customer.service';
import { Customer } from '../../../../types/customer.model';
import { SalesService } from '../../../../services/sales.service';
import { InventoryService } from '../../../../services/inventory.service';
import { Car } from '../../../../types/car.model';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { ToastService } from '../../../../services/toast.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatRadioModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()]
})
export class CustomerFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  customerForm!: FormGroup;
  customer = signal<Partial<Customer>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة عميل جديد');

  soldCars = signal<(Car & { saleDate: string })[]>([]);

  ngOnInit() {
    this.initializeForm();

    // Check if editing existing customer
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.editMode.set(true);
      this.pageTitle.set('تعديل بيانات العميل');
      const existingCustomer = this.customerService.getCustomerById(id);
      if (existingCustomer) {
        this.customer.set({ ...existingCustomer });
        this.customerForm.patchValue(existingCustomer);

        // Fetch sold cars for this customer
        this.salesService.getInvoicesByCustomerId(existingCustomer.id).subscribe({
          next: (customerInvoices) => {
            const carsMap = new Map(this.inventoryService.cars$().map(c => [c.id, c]));
            const cars: (Car & { saleDate: string })[] = [];
            customerInvoices.forEach(inv => {
                inv.items.forEach(item => {
                    const car = carsMap.get(item.carId);
                    if(car) {
                        const carWithSaleDate: Car & { saleDate: string } = {
                            id: car.id,
                            vin: car.vin,
                            plateNumber: car.plateNumber,
                            istimaraExpiry: car.istimaraExpiry,
                            fahasStatus: car.fahasStatus,
                            make: car.make,
                            model: car.model,
                            year: car.year,
                            condition: car.condition,
                            exteriorColor: car.exteriorColor,
                            interiorColor: car.interiorColor,
                            mileage: car.mileage,
                            transmission: car.transmission,
                            engineSize: car.engineSize,
                            status: car.status,
                            currentLocation: car.currentLocation,
                            photos: car.photos,
                            purchasePrice: car.purchasePrice,
                            additionalCosts: car.additionalCosts,
                            totalCost: car.totalCost,
                            salePrice: car.salePrice,
                            description: car.description,
                            quantity: car.quantity,
                            purchaseDate: car.purchaseDate,
                            floorPlanId: car.floorPlanId,
                            isArchived: car.isArchived,
                            saleDate: inv.invoiceDate // Add saleDate from invoice
                        };
                        cars.push(carWithSaleDate);
                    }
                });
            });
            this.soldCars.set(cars);
          }
        });
      } else {
        this.router.navigate(['/entities/customers']);
      }
    }
  }

  private initializeForm() {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      nationalId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+966\d{9}$/)]],
      phone2: [''],
      email: ['', [Validators.email]],
      address: ['', Validators.required],
      city: [''],
      district: [''],
      postalCode: [''],
      dateOfBirth: [null],
      gender: [''],
      occupation: [''],
      employer: [''],
      monthlyIncome: [null, [Validators.min(0)]],
      creditScore: [null, [Validators.min(0), Validators.max(1000)]],
      preferredContactMethod: ['Phone'],
      notes: [''],
      isActive: [true]
    });
  }
  
  saveCustomer() {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
      const currentDate = new Date().toISOString();

      if (this.editMode()) {
        const updatedCustomer: Customer = {
          ...this.customer(),
          ...formValue,
          lastUpdated: currentDate
        } as Customer;
        this.customerService.updateCustomer(updatedCustomer).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.EDIT_SUCCESS');
            this.router.navigate(['/entities/customers']);
          },
          error: (error) => {
            console.error('Error updating customer:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      } else {
        const newCustomer: Omit<Customer, 'id'> = {
          ...formValue,
          isActive: true,
          createdDate: currentDate,
          lastUpdated: currentDate
        };
        this.customerService.addCustomer(newCustomer).subscribe({
          next: () => {
            this.toastService.showSuccess('TOAST.ADD_SUCCESS');
            this.router.navigate(['/entities/customers']);
          },
          error: (error) => {
            console.error('Error adding customer:', error);
            this.toastService.showError('TOAST.SAVE_ERROR');
          }
        });
      }
    } else {
      this.toastService.showWarning('TOAST.VALIDATION_ERROR');
    }
  }

  getDaysRemaining(dateStr: string): number | null {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getFahasExpiry(saleDateStr: string): string {
      const saleDate = new Date(saleDateStr);
      saleDate.setFullYear(saleDate.getFullYear() + 1);
      return saleDate.toISOString().split('T')[0];
  }
}
    