import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { ClientQuotation, ClientQuotationItem } from '../../../models/client-quotation.model';

@Component({
  selector: 'app-client-quotation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    DxDataGridModule,
    DxButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TranslateModule
  ],
  templateUrl: './client-quotation-form.component.html',
  styleUrls: ['./client-quotation-form.component.css']
})
export class ClientQuotationFormComponent {
  headerForm: FormGroup;
  details: ClientQuotationItem[] = [];
  displayedColumns: string[] = ['carDescription', 'quantity', 'unitPrice', 'discount', 'tax', 'lineTotal', 'actions'];

  currencies = [
    { value: 'SAR', label: 'ريال سعودي (SAR)' },
    { value: 'USD', label: 'دولار أمريكي (USD)' },
    { value: 'EUR', label: 'يورو (EUR)' }
  ];

  constructor(private fb: FormBuilder) {
    this.headerForm = this.fb.group({
      quotationNumber: [{ value: 'Auto Number', disabled: true }],
      customerId: [null, Validators.required],
      quotationDate: [new Date(), Validators.required],
      validityPeriod: ['', Validators.required],
      currency: ['SAR', Validators.required],
      notes: ['']
    });
  }

  addDetail(): void {
    const newItem: ClientQuotationItem = {
      carId: 0,
      carDescription: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
      lineTotal: 0,
      deliveryPeriod: '',
      notes: ''
    };
    this.details = [...this.details, newItem];
  }

  removeDetail(index: number): void {
    this.details.splice(index, 1);
    this.details = [...this.details];
  }

  calculateLineTotal(detail: ClientQuotationItem): void {
    const subtotal = (detail.quantity * detail.unitPrice) - (detail.discount || 0);
    detail.lineTotal = subtotal + (subtotal * (detail.tax || 0) / 100);
  }

  // DevExtreme grid helper: calculate displayed line total for a row
  calculateLineTotalForGrid = (data: any) => {
    const quantity = data?.quantity || 1;
    const unitPrice = data?.unitPrice || 0;
    const discount = data?.discount || 0;
    const tax = data?.tax || 0;
    const subtotal = (quantity * unitPrice) - discount;
    return +(subtotal + (subtotal * tax / 100)).toFixed(2);
  }

  onRowInserted(e: any): void {
    if (e && e.data) {
      this.calculateLineTotal(e.data);
      this.details = [...this.details];
    }
  }

  onRowUpdated(e: any): void {
    if (e && e.data) {
      this.calculateLineTotal(e.data);
      this.details = [...this.details];
    }
  }

  onRowRemoved(e: any): void {
    if (e && e.data) {
      const idx = this.details.indexOf(e.data);
      if (idx > -1) {
        this.details.splice(idx, 1);
      }
      this.details = [...this.details];
    }
  }

  onSave(): void {
    if (this.headerForm.valid && this.details.length > 0) {
      const formValue = {
        ...this.headerForm.getRawValue(),
        details: this.details
      };
      console.log('Supplier Quotation:', formValue);
      // TODO: Call service to save
    }
  }

  onCancel(): void {
    this.headerForm.reset();
    this.details = [];
  }
}