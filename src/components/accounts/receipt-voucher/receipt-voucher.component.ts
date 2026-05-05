import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { SimpleReceiptVoucher, SimpleReceiptDetail } from '../../../../src/models/receipt-voucher.model';
import { ChartOfAccountsService } from '../../../../src/services/chart-of-accounts.service';
import { PaymentService } from '../../../../src/services/payment.service';
import { InventoryService } from '../../../../src/services/inventory.service';
import { Car } from '../../../../src/models/car.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { AccountNode } from '../../../../src/models/account-node.model';

@Component({
  selector: 'app-receipt-voucher',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule
  ],
  templateUrl: './receipt-voucher.component.html',
  styleUrl: './receipt-voucher.component.css'
})
export class ReceiptVoucherComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(ChartOfAccountsService);
  private paymentService = inject(PaymentService);
  private inventoryService = inject(InventoryService);

  form!: FormGroup;
  accounts$!: Observable<AccountNode[]>;
  cars$!: Observable<Car[]>;
  detailsData = new BehaviorSubject<SimpleReceiptDetail[]>([]);

  paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CARD', label: 'Card' }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      date: [new Date().toISOString().split('T')[0]],
      paymentMethod: ['', Validators.required],
      sourceAccountId: [null, Validators.required]
    }, { validators: this.sumValidator });

    this.accounts$ = this.accountService.getAccounts();
    this.cars$ = this.inventoryService.getCars();
  }

  addDetail(): void {
    const current = this.detailsData.value;
    this.detailsData.next([...current, { incomeAccountId: null, carId: null, amount: 0, note: '', balance: 0 }]);
  }

  removeDetail(index: number): void {
    const current = this.detailsData.value;
    this.detailsData.next(current.filter((_, i) => i !== index));
  }

  distributeEvenly(): void {
    const totalAmount = this.form.get('totalAmount')?.value || 0;
    const current = this.detailsData.value;
    const count = current.length;
    if (count > 0) {
      const amountPerRow = totalAmount / count;
      const updated = current.map(detail => ({ ...detail, amount: amountPerRow }));
      this.detailsData.next(updated);
    }
  }

  sumValidator(form: AbstractControl): ValidationErrors | null {
    const totalAmount = form.get('totalAmount')?.value || 0;
    const sum = this.detailsData.value.reduce((acc, detail) => acc + (detail.amount || 0), 0);
    return Math.abs(sum - totalAmount) < 0.01 ? null : { sumMismatch: true };
  }

  getTotalAmount(): number {
    return this.detailsData.value.reduce((acc, detail) => acc + (detail.amount || 0), 0);
  }

  save(): void {
    if (this.form.valid) {
      const voucher: SimpleReceiptVoucher = { ...this.form.value, details: this.detailsData.value };
      // Assume save method
      console.log(voucher);
    }
  }

  onRowUpdated(e: any): void {
    if (e.key && e.newData.carId !== undefined) {
      const carId = e.newData.carId;
      if (carId) {
        // Assume method to get balance
        this.inventoryService.getCarById(carId).subscribe(car => {
          // TODO: Implement actual outstanding balance calculation
          const balance = 0; // Placeholder
          const current = this.detailsData.value;
          const index = current.findIndex(d => d === e.key);
          if (index !== -1) {
            current[index].balance = balance;
            this.detailsData.next([...current]);
          }
        });
      }
    }
  }

  trackByAccountId(index: number, item: AccountNode): number {
    return item.id;
  }
}
