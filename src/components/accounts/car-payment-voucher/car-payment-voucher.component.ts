import { Component, inject, OnInit, signal } from '@angular/core';
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
import { CarPaymentVoucher, CarPaymentDetail } from '../../../../src/models/car-payment-voucher.model';
import { ChartOfAccountsService } from '../../../../src/services/chart-of-accounts.service';
import { PaymentService } from '../../../../src/services/payment.service';
import { PurchasesService } from '../../../../src/services/purchases.service';
import { InventoryService } from '../../../../src/services/inventory.service';
import { AccountNode } from '../../../../src/models/account-node.model';
import { PurchaseInvoice } from '../../../../src/models/purchase-invoice.model';
import { Car } from '../../../../src/models/car.model';
import { Observable, forkJoin, BehaviorSubject } from 'rxjs';
import { AccountingService, DefaultAccountKind } from '../../../../src/components/accounting/accounting.service';
import { DefaultAccountTracker } from '../../../../src/components/shared/default-account/default-account.helper';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-car-payment-voucher',
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
    MatTooltipModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule
  ],
  templateUrl: './car-payment-voucher.component.html',
  styleUrl: './car-payment-voucher.component.css'
})
export class CarPaymentVoucherComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accountService = inject(ChartOfAccountsService);
  private paymentService = inject(PaymentService);
  private purchasesService = inject(PurchasesService);
  private inventoryService = inject(InventoryService);
  private accountingService = inject(AccountingService);

  form!: FormGroup;
  accounts$!: Observable<AccountNode[]>;
  invoices$!: Observable<PurchaseInvoice[]>;
  detailsData = new BehaviorSubject<CarPaymentDetail[]>([]);

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  // Debit ("account") leg: the invoice's supplier AP account once a Purchase Invoice is picked,
  // else the default Cash/Bank payment account (no invoice = a general/cash car cost payment).
  private accountTracker!: DefaultAccountTracker;
  accountManuallyChanged = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      voucherNumber: [''],
      voucherDate: [new Date().toISOString().split('T')[0]],
      totalAmount: [0, [Validators.required, Validators.min(0.01)]],
      accountId: [null, Validators.required],
      purchaseInvoiceId: [null]
    }, { validators: this.sumValidator });

    this.accounts$ = this.accountService.getAccounts();
    this.invoices$ = this.purchasesService.getInvoices();

    this.accountTracker = new DefaultAccountTracker(this.accountingService, this.form.get('accountId') as any);
    this.form.get('accountId')?.valueChanges.subscribe(() =>
      this.accountManuallyChanged = this.accountTracker.manuallyChanged);
    this.accountTracker.recalculate({ kind: DefaultAccountKind.PaymentAccount });
  }

  resetAccountToDefault(): void {
    this.accountTracker.reset();
    this.accountManuallyChanged = false;
  }

  addDetail(): void {
    const current = this.detailsData.value;
    this.detailsData.next([...current, { expenseAccountId: null, carId: null, amount: 0, note: '' }]);
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

  onPurchaseInvoiceChange(invoiceId: number | null): void {
    if (invoiceId) {
      this.purchasesService.getInvoiceById(invoiceId).subscribe(invoice => {
        this.detailsData.next([]);
        if (invoice.supplierId) {
          this.accountTracker.recalculate({ kind: DefaultAccountKind.SupplierPayable, partyId: invoice.supplierId });
        }
        const carIds = invoice.items.map(item => item.carId);
        const carObservables = carIds.map(id => this.inventoryService.getCarById(id));
        forkJoin(carObservables).subscribe(cars => {
          const details: CarPaymentDetail[] = cars.map(car => ({ expenseAccountId: null, carId: car.id, amount: 0, note: '' }));
          this.detailsData.next(details);
          this.distributeEvenly();
        });
      });
    } else {
      this.detailsData.next([]);
      this.accountTracker.recalculate({ kind: DefaultAccountKind.PaymentAccount });
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
      const voucher: CarPaymentVoucher = { ...this.form.value, details: this.detailsData.value };
      this.paymentService.saveCarPaymentVoucher(voucher).subscribe(() => {
        // Handle success
      });
    }
  }

  onRowInserted(e: any): void {
    // The grid modifies the array directly, so emit to update views
    this.detailsData.next([...this.detailsData.value]);
  }

  onRowRemoved(e: any): void {
    this.detailsData.next([...this.detailsData.value]);
  }

  onRowUpdated(e: any): void {
    // Not needed
  }

  trackByAccountId(index: number, item: AccountNode): number {
    return item.id;
  }

  trackByInvoiceId(index: number, item: PurchaseInvoice): number {
    return item.id;
  }
}
