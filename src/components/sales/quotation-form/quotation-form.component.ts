import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SalesCycleService } from '../../../services/sales-cycle.service';
import { Quotation } from '../../../models/quotation.model';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerService } from '@/src/services/customer.service';
import { InventoryService } from '@/src/services/inventory.service';
import { SalesService } from '@/src/services/sales.service';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-quotation-form',
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
  templateUrl: './quotation-form.component.html',
  styleUrls: ['./quotation-form.component.css']
})
export class QuotationFormComponent implements OnInit {
 quotationForm!: FormGroup;
   isEditMode = false;
   quotationId: number | null = null;
 
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
     private salesCycleService: SalesCycleService,
     private customerService: CustomerService,
     private inventoryService: InventoryService
   ) {
     this.quotationForm = this.fb.group({
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
     this.quotationForm.patchValue({
       orderNumber: `SO-${timestamp}`
     });
   }
 
   get availableCars() {
     return this.cars().filter(car => car.status === 'Available');
   }
 
   onSubmit(): void {
     if (this.quotationForm.valid) {
       const formValue: Quotation = {
         ...this.quotationForm.getRawValue(),
         createdDate: new Date().toISOString(),
         lastUpdated: new Date().toISOString()
       };
 
       // Save the quotation
       this.salesCycleService.createQuotation(formValue).subscribe({
         next: (order) => {
           // Update car status to 'Offered'
           const carId = formValue.carId;
           this.inventoryService.updateCarStatus(carId, 'Offered').subscribe({
             next: () => {
               // Navigate to Deposit screen with orderId
               this.router.navigate(['/accounts/deposits'], { queryParams: { orderId: order.id } });
             },
             error: (error) => {
               console.error('Failed to update car status', error);
             }
           });
         },
         error: (error) => {
           console.error('Failed to create quotation', error);
         }
       });
     }
   }
 }