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

export interface QuotationDetail {
  item: string;
  price: number;
  discount: number;
  tax: number;
  deliveryPeriod: string;
  lineTotal: number;
  __id?: number | string;
}

@Component({
  selector: 'app-supplier-quotation-form',
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
  templateUrl: './supplier-quotation-form.component.html',
  styleUrls: ['./supplier-quotation-form.component.css']
})
export class SupplierQuotationFormComponent {
  headerForm: FormGroup;
  details: QuotationDetail[] = [];
  displayedColumns: string[] = ['item', 'price', 'discount', 'tax', 'deliveryPeriod', 'lineTotal', 'actions'];

  currencies = [
    { value: 'SAR', label: 'ريال سعودي (SAR)' },
    { value: 'USD', label: 'دولار أمريكي (USD)' },
    { value: 'EUR', label: 'يورو (EUR)' }
  ];

  constructor(private fb: FormBuilder) {
    this.headerForm = this.fb.group({
      quotationNumber: [{ value: 'Auto Number', disabled: true }],
      purchaseRequestId: [null, Validators.required],
      quotationDate: [new Date(), Validators.required],
      validityPeriod: ['', Validators.required],
      currency: ['SAR', Validators.required],
      notes: ['']
    });
  }

  addDetail(): void {
    const newItem: QuotationDetail = {
      item: '',
      price: 0,
      discount: 0,
      tax: 0,
      deliveryPeriod: '',
      lineTotal: 0
    };
    newItem.__id = Date.now() + Math.floor(Math.random() * 1000);
    this.details = [...this.details, newItem];
  }

  removeDetail(index: number): void {
    this.details.splice(index, 1);
    this.details = [...this.details];
  }

  calculateLineTotal(detail: QuotationDetail): void {
    const subtotal = detail.price - detail.discount;
    detail.lineTotal = subtotal + (subtotal * detail.tax / 100);
  }

  // DevExtreme grid helper: calculate displayed line total for a row
  calculateLineTotalForGrid = (data: any) => {
    const price = data?.price || 0;
    const discount = data?.discount || 0;
    const tax = data?.tax || 0;
    const subtotal = price - discount;
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