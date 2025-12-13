import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { SaleType } from '../../../../types/sales-enhancements.model';

@Component({
  selector: 'app-sale-type-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    TranslateModule
  ],
  templateUrl: './sale-type-selector.component.html',
  styleUrls: ['./sale-type-selector.component.css']
})
export class SaleTypeSelectorComponent {
  @Input() saleTypeControl!: FormControl<SaleType | null>;
  @Input() downPaymentControl!: FormControl<number | null>;
  @Output() saleTypeChange = new EventEmitter<SaleType>();

  saleTypes = [
    { value: SaleType.Cash, label: 'SALES.TYPE.CASH' },
    { value: SaleType.Credit, label: 'SALES.TYPE.CREDIT' },
    { value: SaleType.Installments, label: 'SALES.TYPE.INSTALLMENTS' }
  ];

  onSaleTypeChange(saleType: SaleType): void {
    this.saleTypeChange.emit(saleType);
    this.updateDownPaymentValidation(saleType);
  }

  private updateDownPaymentValidation(saleType: SaleType): void {
    if (saleType === SaleType.Credit || saleType === SaleType.Installments) {
      this.downPaymentControl.setValidators([Validators.required, Validators.min(0)]);
    } else {
      this.downPaymentControl.clearValidators();
    }
    this.downPaymentControl.updateValueAndValidity();
  }
}