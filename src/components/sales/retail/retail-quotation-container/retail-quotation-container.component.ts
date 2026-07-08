import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CustomerInfoFormComponent } from './customer-info-form/customer-info-form.component';
import { InventorySelectorComponent } from './inventory-selector/inventory-selector.component';
import { RetailService } from '../../../../services/retail.service';
import { ToastService } from '../../../../services/toast.service';
import { RetailCustomerInfo, RetailQuotationItem } from '../../../../models/retail/retail-quotation.model';
import { Car } from '../../../../models/car.model';

@Component({
  selector: 'app-retail-quotation-container',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    CustomerInfoFormComponent,
    InventorySelectorComponent
  ],
  templateUrl: './retail-quotation-container.component.html',
  styleUrls: ['./retail-quotation-container.component.css']
})
export class RetailQuotationContainerComponent {
  customer: RetailCustomerInfo | null = null;
  selectedCar: Car | null = null;
  submitting = false;

  constructor(
    private retailService: RetailService,
    private router: Router,
    private toast: ToastService
  ) {}

  onCustomerChange(customer: RetailCustomerInfo | null): void {
    this.customer = customer;
  }

  onCarSelected(car: Car | null): void {
    this.selectedCar = car;
  }

  get isFormValid(): boolean {
    return !!this.customer && !!this.selectedCar;
  }

  get totalAmount(): number {
    return this.selectedCar?.salePrice ?? 0;
  }

  onSubmit(): void {
    if (!this.isFormValid || !this.customer || !this.selectedCar) {
      return;
    }

    const items: RetailQuotationItem[] = [
      {
        carId: this.selectedCar.id,
        carDescription: `${this.selectedCar.make} ${this.selectedCar.model} (${this.selectedCar.year})`,
        unitPrice: this.selectedCar.salePrice
      }
    ];

    this.submitting = true;
    this.retailService
      .createQuotation({
        quotationDate: new Date().toISOString().split('T')[0],
        customer: this.customer,
        items,
        totalAmount: this.totalAmount
      })
      .subscribe({
        next: quotation => {
          this.submitting = false;
          this.toast.showSuccess('RETAIL.QUOTATION_CREATED');
          this.router.navigate(['/sales/retail/invoices/new'], {
            queryParams: { quotationId: quotation.id }
          });
        },
        error: () => {
          this.submitting = false;
          this.toast.showError('RETAIL.QUOTATION_CREATE_FAILED');
        }
      });
  }
}
