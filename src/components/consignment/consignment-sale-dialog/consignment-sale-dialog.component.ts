import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ConsignmentCar, CommissionType } from '../../../models/consignment-car.model';
import { Customer } from '../../../models/customer.model';
import { Account } from '../../accounting/models';
import { AccountingService, DefaultAccountKind } from '../../accounting/accounting.service';
import { openCreateAccountDialog } from '../../accounting/create-account-dialog.helper';
import { DefaultAccountTracker } from '@/src/components/shared/default-account/default-account.helper';
import { CustomerLookupModalComponent } from '../../shared/customer-lookup-modal/customer-lookup-modal.component';
import { ConsignmentSaleService } from '../../../services/consignment-sale.service';
import { AuthService } from '../../../services/AuthService.service';
import { MatDialog } from '@angular/material/dialog';

export interface ConsignmentSaleDialogData {
  car: ConsignmentCar;
}

/** Sell dialog for a consignment (third-party) vehicle: captures the sale price, payment split,
 * commission override (defaults to the car's own rate/type), and the three posting accounts
 * (Debit Cash/AR, Commission Revenue, Owner Payable), then calls ConsignmentSaleService.sell()
 * which posts the balanced 2-3 line journal entry and marks the vehicle Sold server-side. */
@Component({
  selector: 'app-consignment-sale-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './consignment-sale-dialog.component.html',
  styleUrl: './consignment-sale-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentSaleDialogComponent {
  private dialogRef = inject(MatDialogRef<ConsignmentSaleDialogComponent>);
  private dialog = inject(MatDialog);
  private accountingService = inject(AccountingService);
  private consignmentSaleService = inject(ConsignmentSaleService);
  private authService = inject(AuthService);

  car: ConsignmentCar;
  saving = signal(false);
  errorMessage = signal<string | null>(null);

  selectedCustomer = signal<Customer | null>(null);
  debitAccounts = signal<Account[]>([]);
  commissionAccounts = signal<Account[]>([]);
  payableAccounts = signal<Account[]>([]);

  commissionTypeOptions: { value: CommissionType; labelKey: string }[] = [
    { value: 'Percentage', labelKey: 'CONSIGNMENT.SALE.COMMISSION_PERCENTAGE' },
    { value: 'FixedAmount', labelKey: 'CONSIGNMENT.SALE.COMMISSION_FIXED' },
  ];

  saleForm = new FormGroup({
    customerId: new FormControl<number | null>(null, Validators.required),
    saleDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
    salePrice: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    commissionType: new FormControl<CommissionType>('Percentage', Validators.required),
    commissionRate: new FormControl<number | null>(0),
    commissionFixedAmount: new FormControl<number | null>(0),
    isCash: new FormControl(true),
    amountPaid: new FormControl<number | null>(0),
    debitAccountId: new FormControl<number | null>(null, Validators.required),
    commissionRevenueAccountId: new FormControl<number | null>(null, Validators.required),
    ownerPayableAccountId: new FormControl<number | null>(null, Validators.required),
    notes: new FormControl(''),
  });

  // ── Default account + manual override (see DefaultAccountTracker) ──────────────────────────
  // Debit leg: Cash/Bank payment account (isCash) or the buying customer's AR account (credit),
  // recalculated whenever isCash or customerId changes. Owner Payable: the car's owning supplier's
  // AP account -- ConsignmentCar.SupplierId is always known up front, so this resolves immediately.
  // Commission Revenue has NO default source today: ConsignmentCar/ConsignmentSale carry no StoreId
  // (only an optional BranchId), and ResolveCommissionRevenueAccountAsync needs a StoreId to read
  // StoreAccountingConfiguration -- left fully manual rather than guessing a store.
  private debitAccountTracker!: DefaultAccountTracker;
  private ownerPayableAccountTracker!: DefaultAccountTracker;
  debitAccountManuallyChanged = computed(() => this.debitAccountManuallyChangedSignal());
  ownerPayableAccountManuallyChanged = computed(() => this.ownerPayableAccountManuallyChangedSignal());
  private debitAccountManuallyChangedSignal = signal(false);
  private ownerPayableAccountManuallyChangedSignal = signal(false);

  /** Live preview only -- the authoritative commission amount is recomputed server-side. */
  commissionPreview = computed(() => {
    const salePrice = this.saleForm.get('salePrice')?.value ?? 0;
    const type = this.saleForm.get('commissionType')?.value;
    const rate = this.saleForm.get('commissionRate')?.value ?? 0;
    const fixed = this.saleForm.get('commissionFixedAmount')?.value ?? 0;
    const commission = type === 'FixedAmount' ? fixed : Math.round((salePrice * rate) / 100 * 100) / 100;
    return {
      commission,
      ownerProceeds: Math.max(0, salePrice - commission),
    };
  });

  // --- Requirement 9: "+ Create Account" from this document -----------------------------------
  openCreateDebitAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.debitAccounts.update(list => [...list, created]);
      this.saleForm.get('debitAccountId')?.setValue(created.id);
    });
  }

  openCreateCommissionRevenueAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.commissionAccounts.update(list => [...list, created]);
      this.saleForm.get('commissionRevenueAccountId')?.setValue(created.id);
    });
  }

  openCreateOwnerPayableAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.payableAccounts.update(list => [...list, created]);
      this.saleForm.get('ownerPayableAccountId')?.setValue(created.id);
    });
  }

  constructor(@Inject(MAT_DIALOG_DATA) data: ConsignmentSaleDialogData) {
    this.car = data.car;
    this.saleForm.patchValue({
      salePrice: data.car.expectedSalePrice,
      commissionType: data.car.commissionType,
      commissionRate: data.car.commissionRate,
      commissionFixedAmount: data.car.commissionFixedAmount,
      amountPaid: data.car.expectedSalePrice,
    });

    this.debitAccountTracker = new DefaultAccountTracker(this.accountingService, this.saleForm.get('debitAccountId') as any);
    this.ownerPayableAccountTracker = new DefaultAccountTracker(this.accountingService, this.saleForm.get('ownerPayableAccountId') as any);
    this.saleForm.get('debitAccountId')?.valueChanges.subscribe(() =>
      this.debitAccountManuallyChangedSignal.set(this.debitAccountTracker.manuallyChanged));
    this.saleForm.get('ownerPayableAccountId')?.valueChanges.subscribe(() =>
      this.ownerPayableAccountManuallyChangedSignal.set(this.ownerPayableAccountTracker.manuallyChanged));

    this.saleForm.get('isCash')?.valueChanges.subscribe((isCash) => {
      if (isCash) {
        this.saleForm.patchValue({ amountPaid: this.saleForm.get('salePrice')?.value ?? 0 }, { emitEvent: false });
      }
      this.recalculateDebitAccountDefault();
    });
    this.saleForm.get('customerId')?.valueChanges.subscribe(() => this.recalculateDebitAccountDefault());
    // Owner Payable never depends on any field the user fills in -- the car's own SupplierId is
    // always known as soon as the dialog opens.
    this.ownerPayableAccountTracker.recalculate({ kind: DefaultAccountKind.ConsignmentOwnerPayable, partyId: this.car.supplierId });

    this.accountingService.getPostableAccounts('debit').subscribe((accounts) => this.debitAccounts.set(accounts));
    this.accountingService.getPostableAccounts().subscribe((accounts) => {
      this.commissionAccounts.set(accounts);
      this.payableAccounts.set(accounts);
    });
  }

  private recalculateDebitAccountDefault(): void {
    const isCash = this.saleForm.get('isCash')?.value ?? true;
    if (isCash) {
      this.debitAccountTracker.recalculate({ kind: DefaultAccountKind.PaymentAccount });
      return;
    }
    const customerId = this.saleForm.get('customerId')?.value;
    if (customerId) {
      this.debitAccountTracker.recalculate({ kind: DefaultAccountKind.CustomerReceivable, partyId: customerId });
    }
  }

  /** "Reset to Default" action next to an overridden account field. */
  resetDebitAccountToDefault(): void {
    this.debitAccountTracker.reset();
    this.debitAccountManuallyChangedSignal.set(false);
  }

  resetOwnerPayableAccountToDefault(): void {
    this.ownerPayableAccountTracker.reset();
    this.ownerPayableAccountManuallyChangedSignal.set(false);
  }

  openCustomerLookup(): void {
    const ref = this.dialog.open(CustomerLookupModalComponent, { width: '900px', panelClass: 'responsive-dialog-panel' });
    ref.afterClosed().subscribe((customer: Customer | null) => {
      if (customer) {
        this.selectedCustomer.set(customer);
        this.saleForm.patchValue({ customerId: customer.id });
      }
    });
  }

  save(): void {
    if (this.saleForm.invalid || this.saving()) {
      this.saleForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);

    const v = this.saleForm.value;
    const currentUserId = this.authService.currentUser()?.id ?? 0;

    this.consignmentSaleService
      .sell({
        consignmentCarId: this.car.id,
        customerId: v.customerId!,
        saleDate: v.saleDate!,
        salePrice: v.salePrice!,
        commissionType: v.commissionType ?? undefined,
        commissionRate: v.commissionRate ?? undefined,
        commissionFixedAmount: v.commissionFixedAmount ?? undefined,
        isCash: v.isCash ?? true,
        amountPaid: v.amountPaid ?? 0,
        debitAccountId: v.debitAccountId!,
        commissionRevenueAccountId: v.commissionRevenueAccountId!,
        ownerPayableAccountId: v.ownerPayableAccountId!,
        notes: v.notes || undefined,
        createdBy: currentUserId,
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          if (response.success) {
            this.dialogRef.close(response.data);
          } else {
            this.errorMessage.set(response.message);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? err?.message ?? 'Error');
        },
      });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
