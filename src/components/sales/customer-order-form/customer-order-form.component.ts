import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { CustomerOrder } from '../../../models/customer-order.model';
import { CustomerService } from '../../../services/customer.service';
import { InventoryService } from '../../../services/inventory.service';
import { SalesService } from '../../../services/sales.service';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-customer-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './customer-order-form.component.html',
  styleUrls: ['./customer-order-form.component.css']
})
export class CustomerOrderFormComponent implements OnInit {
  customerOrderForm: FormGroup;
  isEditMode = false;
  customerOrderId: number | null = null;

  customers = this.customerService.customers$;
  cars = this.inventoryService.cars$;

  cardLayout = this.breakpointObserver.observe([
    Breakpoints.Handset,
    Breakpoints.Tablet,
    Breakpoints.Web
  ]).pipe(
    map(({ matches }) => {
      if (matches) {
        return {
          columns: 1,
          miniCard: { cols: 1, rows: 1 }
        };
      }
      return {
        columns: 2,
        miniCard: { cols: 1, rows: 1 }
      };
    })
  );

  constructor(
    private fb: FormBuilder,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private salesService: SalesService,
    private customerService: CustomerService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {
    this.customerOrderForm = this.fb.group({
      orderNumber: [{ value: '', disabled: true }, Validators.required],
      customerId: ['', Validators.required],
      vehicleId: ['', Validators.required],
      status: ['Pending']
    });
  }

  ngOnInit(): void {
    // Signals are already reactive, no need to subscribe
    // Auto-generate order number
    this.generateOrderNumber();
  }

  generateOrderNumber(): void {
    // Simple auto-generation, in real app might call API
    const timestamp = Date.now();
    this.customerOrderForm.patchValue({
      orderNumber: `CO-${timestamp}`
    });
  }

  get availableCars() {
    return this.cars().filter(car => car.status === 'Available');
  }

  onSubmit(): void {
    if (!this.customerOrderForm.valid) {
      this.customerOrderForm.markAllAsTouched();
      this.notificationService.showError('Please select a customer and a vehicle.');
      return;
    }

    const formValue: CustomerOrder = {
      ...this.customerOrderForm.getRawValue(),
      createdDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Save the customer order
    this.salesService.createCustomerOrder(formValue).subscribe({
      next: (order) => {
        // Update car status to 'Offered'
        const vehicleId = formValue.vehicleId;
        this.inventoryService.updateCarStatus(vehicleId, 'Offered').subscribe({
          next: () => {
            // Navigate to Deposit screen with orderId
            this.router.navigate(['/accounts/deposits'], { queryParams: { orderId: order.id } });
          },
          error: (error) => {
            console.error('Failed to update car status', error);
            this.notificationService.showError('Order created, but updating the vehicle status failed. Please check the vehicle record.');
          }
        });
      },
      error: (error) => {
        console.error('Failed to create customer order', error);
        this.notificationService.showError('Failed to create the customer order. Please try again.');
      }
    });
  }
}