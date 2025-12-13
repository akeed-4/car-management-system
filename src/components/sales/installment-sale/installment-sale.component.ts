import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-installment-sale',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
  templateUrl: './installment-sale.component.html',
  styleUrl: './installment-sale.component.css',
})
export class InstallmentSaleComponent implements OnInit {
  @Input() parentForm!: FormGroup;

  get installments(): FormArray {
    return this.parentForm?.get('installments') as FormArray || new FormArray([]);
  }

  get installmentsArray(): FormArray | null {
    return this.parentForm?.get('installments') as FormArray || null;
  }

  ngOnInit() {
    if (this.parentForm) {
      this.parentForm.addControl('downPayment', new FormControl('', [Validators.required, Validators.min(0)]));
      this.parentForm.addControl('installments', new FormArray([]));
    }
  }

  addInstallment() {
    if (this.installments) {
      const installmentGroup = new FormGroup({
        amount: new FormControl('', [Validators.required, Validators.min(0)]),
        date: new FormControl('', Validators.required),
      });
      this.installments.push(installmentGroup);
    }
  }
}