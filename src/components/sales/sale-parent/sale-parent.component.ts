import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { SaleType } from '../../../types/sales-enhancements.model';
import { SalesInvoiceCashComponent } from '../sales-invoice-cash/sales-invoice-cash.component';
import { SalesInvoiceCreditComponent } from '../sales-invoice-credit/sales-invoice-credit.component';
import { SalesInvoiceInstallmentsComponent } from '../sales-invoice-installments/sales-invoice-installments.component';

@Component({
  selector: 'app-sale-parent',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    TranslateModule,
    SalesInvoiceCashComponent,
    SalesInvoiceCreditComponent,
    SalesInvoiceInstallmentsComponent,
  ],
  templateUrl: './sale-parent.component.html',
  styleUrls: ['./sale-parent.component.css'],
})
export class SaleParentComponent {
  private fb = inject(FormBuilder);

  saleForm = this.fb.group({
    saleType: [SaleType.Cash, Validators.required],
    approved: [false],
  });

  saleTypes = Object.values(SaleType);

  onSubmit() {
    if (this.saleForm.valid) {
      console.log('Sale form submitted:', this.saleForm.value);
      // Handle form submission
    }
  }
}