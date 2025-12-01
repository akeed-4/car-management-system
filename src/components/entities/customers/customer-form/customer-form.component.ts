

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../../services/customer.service';
import { Customer } from '../../../../types/customer.model';
import { SalesService } from '../../../../services/sales.service';
import { InventoryService } from '../../../../services/inventory.service';
import { Car } from '../../../../types/car.model';
import { DatePipe, CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService = inject(CustomerService);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);

  customer = signal<Partial<Customer>>({});
  editMode = signal(false);
  pageTitle = signal('إضافة عميل جديد');

  soldCars = signal<(Car & { saleDate: string })[]>([]);

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.editMode.set(true);
        this.pageTitle.set('تعديل بيانات العميل');
        const existingCustomer = this.customerService.getCustomerById(id);
        if (existingCustomer) {
          this.customer.set({ ...existingCustomer });
          
          // Fetch sold cars for this customer
          const customerInvoices = this.salesService.getInvoicesByCustomerId(existingCustomer.id);
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

        } else {
          this.router.navigate(['/entities/customers']);
        }
      }
    }, { allowSignalWrites: true });
  }
  
  updateCustomerField<K extends keyof Customer>(field: K, value: Customer[K]) {
    this.customer.update(c => ({ ...c, [field]: value }));
  }

  saveCustomer() {
    const customerData = this.customer();
    if (this.editMode()) {
        this.customerService.updateCustomer(customerData as Customer);
    } else {
        const newCustomer: Omit<Customer, 'id'> = {
            name: customerData.name ?? '',
            nationalId: customerData.nationalId ?? '',
            phone: customerData.phone ?? '',
            address: customerData.address ?? ''
        };
        this.customerService.addCustomer(newCustomer);
    }
    this.router.navigate(['/entities/customers']);
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
    