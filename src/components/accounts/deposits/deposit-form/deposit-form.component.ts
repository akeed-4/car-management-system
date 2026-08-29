import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { DepositService } from '../../../../services/deposit.service';
import { Car } from '../../../../models/car.model';
import { buildVehicleDescription } from '../../../../models/vehicle-description';
import type { SalesCarSelectionCard } from '../../../sales/car-selection-dialog/car-selection-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounce, finalize, map, of, switchMap } from 'rxjs';

import { DepositVoucher, DepositPaymentMethod } from '@/src/models/deposit-voucher.model';
import { ChartOfAccountsService } from '../../../../services/chart-of-accounts.service';
import { AccountNode } from '../../../../models/account-node.model';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AccountingService } from '@/src/components/accounting/accounting.service';
import { openCreateAccountDialog } from '@/src/components/accounting/create-account-dialog.helper';
import { Account } from '@/src/components/accounting/models';
import { NotificationService } from '@/src/services/notification.service';
import { extractErrorMessage } from '@/src/models/http-error-message';

@Component({
  selector: 'app-deposit-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './deposit-form.component.html',
  styleUrl: './deposit-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private customerService: CustomerService = inject(CustomerService);
  private inventoryService: InventoryService = inject(InventoryService);
  private depositService: DepositService = inject(DepositService);
  protected translate = inject(TranslateService);
  private dialog = inject(MatDialog);
private notificationService = inject(NotificationService);
  private accountingService: AccountingService = inject(AccountingService);
  accounts = signal<Account[]>([]);
  creditAccounts = computed(() => this.accounts());
  debitAccounts = computed(() => this.accounts());
  openCarSelectionDialog() {
    import('../../../../components/sales/car-selection-dialog/car-selection-dialog.component').then(({ CarSelectionDialogComponent }) => {
      const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
        width: '900px',
        data: {
          cars: this.availableVehicles(),
        },
        autoFocus: true,
        disableClose: false,
        panelClass: 'responsive-dialog-panel'
      });
      // Dialog result is normalized to StoreCarStockDto shape (carId), even though this caller
      // supplied plain Car[] -- see CarSelectionDialogComponent.normalize().
      dialogRef.afterClosed().subscribe((selectedCar: SalesCarSelectionCard | undefined) => {
        if (selectedCar?.carId) {
          this.depositForm.patchValue({ vehicleId: selectedCar.carId });
          this.selectedVehicleId.set(selectedCar.carId);
        }
      });
    });
  }

  // --- Requirement 9: "+ Create Account" from this document -----------------------------------
  openCreateDebitAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.depositForm.get('debitAccountId')?.setValue(created.id);
    });
  }

  openCreateCreditAccountDialog(): void {
    openCreateAccountDialog(this.dialog).subscribe((created) => {
      if (!created) return;
      this.accounts.update(list => [...list, created]);
      this.depositForm.get('creditAccountId')?.setValue(created.id);
    });
  }

  depositForm!: FormGroup;
  isSaving = signal(false);
  selectedCustomerId = signal<number | null>(null);
  selectedReservationHolderId = signal<number | null>(null);
  selectedVehicleId = signal<number | null>(null);
  vehicleSearch = signal('');
  existingDocNumber: string | null = null;

  paymentMethods: Array<{ value: DepositPaymentMethod; label: string }> = [
    { value: 'CASH', label: 'ACCOUNTS.CAR_PAYMENT_FORM.PAYMENT_METHODS.CASH' },
    { value: 'CARD', label: 'ACCOUNTS.DEPOSITS.FORM.PAYMENT_METHOD_CARD' },
    { value: 'BANK_TRANSFER', label: 'ACCOUNTS.CAR_PAYMENT_FORM.PAYMENT_METHODS.BANK_TRANSFER' },
    { value: 'CHEQUE', label: 'ACCOUNTS.CAR_PAYMENT_FORM.PAYMENT_METHODS.CHEQUE' }
  ];

  customers = this.customerService.customers$;

  availableVehicles = computed(() => {
    const allCars = this.inventoryService.cars$();
    const deposits = this.depositService.deposits$();
    const selectedVehicleId = this.selectedVehicleId();

    return allCars.filter(car => {
      const allowedStatus = car.status === 'Available' || car.status === 'Reserved';
      const hasDeposit = deposits.some(d => d.carId === car.id);

      return allowedStatus && (!hasDeposit || car.id === selectedVehicleId);
    });
  });

  filteredVehicles = computed(() => {
    const searchTerm = this.vehicleSearch().trim().toLowerCase();

    if (!searchTerm) {
      return this.availableVehicles();
    }

    return this.availableVehicles().filter(car => {
      const searchable = [
        car.make,
        car.model,
        car.plateNumber,
        car.chassisNumber,
        car.vin,
        String(car.year)
      ].join(' ').toLowerCase();

      return searchable.includes(searchTerm);
    });
  });

  selectedCustomer = computed(() => {
    const customerId = this.selectedCustomerId();
    if (!customerId) return null;
    return this.customers().find(c => c.id === customerId);
  });

  selectedReservationHolder = computed(() => {
    const customerId = this.selectedReservationHolderId();
    if (!customerId) return null;
    return this.customers().find(c => c.id === customerId);
  });

  selectedVehicle = computed(() => {
    const vehicleId = this.selectedVehicleId();
    if (!vehicleId) return null;
    return this.availableVehicles().find(v => v.id === vehicleId);
  });

  ngOnInit() {
    this.initForm();
    this.watchFormControls();

    // Load accounts for dropdowns -- Debit/Credit selectors must only offer leaf/postable
    // accounts, excluded server-side by this endpoint rather than filtered client-side.
    this.accountingService.getPostableAccounts().subscribe(accs => this.accounts.set(accs));

    const routePath = this.route.snapshot.routeConfig?.path ?? '';

    // If the route is the edit path, treat the 'id' param as the deposit id to load
    if (routePath.includes('edit')) {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        const deposit = this.depositService.getDepositById(id);
        if (deposit) {
          this.existingDocNumber = deposit.voucherNumber;
          this.depositForm.patchValue({
            date: new Date(deposit.date).toISOString().split('T')[0],
            status: deposit.status,
            customerType: deposit.customerType,
            customerId: deposit.customerId,
            customerName: deposit.customerName,
            vehicleId: deposit.carId,
            agreedSellingPrice: deposit.agreedSellingPrice,
            finalInvoicePriceFixed: deposit.finalInvoicePriceFixed,
            depositAmount: deposit.amount,
            paymentMethod: deposit.paymentMethod,
            currency: deposit.currency,
            reservationValidityDays: deposit.reservationValidityDays,
            isRefundable: deposit.isRefundable,
            notes: deposit.notes,
            creditAccountId: deposit.creditAccountId,
            debitAccountId: deposit.debitAccountId
          });
          this.selectedVehicleId.set(deposit.carId);
          this.selectedCustomerId.set(deposit.customerId ?? null);
        }
      }
      return;
    }

    // Otherwise treat 'id' (or 'carId') as a pre-selected vehicle id for a new deposit
    const carIdParam = this.route.snapshot.params['id'];
    if (carIdParam) {
      const carId = Number(carIdParam);
      this.depositForm.patchValue({ vehicleId: carId });
      this.selectedVehicleId.set(carId);
    }
  }

  private initForm() {
    this.depositForm = new FormGroup({
      date: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      status: new FormControl('DRAFT'),
      customerType: new FormControl<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL', Validators.required),
      customerId: new FormControl<number | null>(null),
      customerName: new FormControl('', Validators.required),
      vehicleSearch: new FormControl(''),
      vehicleId: new FormControl(null, Validators.required),
      agreedSellingPrice: new FormControl(0, [Validators.required, Validators.min(0)]),
      finalInvoicePriceFixed: new FormControl(true),
      depositAmount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('CASH', Validators.required),
      currency: new FormControl('SAR'),
      reservationValidityDays: new FormControl(10, [Validators.required, Validators.min(1)]),
      isRefundable: new FormControl(true),
      notes: new FormControl(''),
      creditAccountId: new FormControl(null, Validators.required),
      debitAccountId: new FormControl(null, Validators.required)
    });
  }

  private watchFormControls() {
    this.depositForm.get('customerId')?.valueChanges.subscribe(value => {
      const customerId = value ? Number(value) : null;
      this.selectedCustomerId.set(customerId);

      const customer = this.customers().find(item => item.id === customerId);
      if (!customer) {
        return;
      }

      this.depositForm.patchValue({
        customerName: customer.name,
        customerPhone: customer.phone,
        customerNationalId: customer.nationalId
      }, { emitEvent: false });
    });

    this.depositForm.get('reservedByCustomerId')?.valueChanges.subscribe(value => {
      const customerId = value ? Number(value) : null;
      this.selectedReservationHolderId.set(customerId);

      const customer = this.customers().find(item => item.id === customerId);
      if (!customer) {
        return;
      }

      this.depositForm.patchValue({
        reservedByCustomerName: customer.name,
        reservedByNationalId: customer.nationalId
      }, { emitEvent: false });
    });

    this.depositForm.get('vehicleId')?.valueChanges.subscribe(value => {
      const vehicleId = value ? Number(value) : null;
      this.selectedVehicleId.set(vehicleId);

      const vehicle = this.availableVehicles().find(item => item.id === vehicleId);
      if (!vehicle) {
        return;
      }

      this.depositForm.patchValue({
        agreedSellingPrice: vehicle.salePrice
      }, { emitEvent: false });
    });

    this.depositForm.get('vehicleSearch')?.valueChanges.subscribe(value => {
      this.vehicleSearch.set((value ?? '').trim());
    });

    this.depositForm.get('customerType')?.valueChanges.subscribe(value => {
      if (value === 'COMPANY') {
        this.depositForm.patchValue({ customerId: null }, { emitEvent: false });
        this.selectedCustomerId.set(null);
      }
    });
  }

  saveDeposit() {
    if (this.depositForm.invalid) {
      this.depositForm.markAllAsTouched();
      return;
    }

    const formValue = this.depositForm.getRawValue();
    const customer = this.selectedCustomer();
    const vehicle = this.selectedVehicle();

    if (!vehicle || !formValue.customerName?.trim() || Number(formValue.depositAmount) <= 0) {
      this.notificationService.showWarning(this.translate.instant('ACCOUNTS.DEPOSITS.FORM.FILL_REQUIRED'));
      return;
    }

    const newDeposit: Omit<DepositVoucher, 'id'> = {
      voucherNumber: this.existingDocNumber || '',
      voucherType: 'DEPOSIT',
      date: new Date(formValue.date),
      amount: Number(formValue.depositAmount),
      // map string payment methods to backend numeric codes when required
      paymentMethod: ((): any => {
        const map: Record<string, number> = {
          CASH: 1,
          BANK_TRANSFER: 2,
          CARD: 3,
          CHEQUE: 4
        };
        return (map as any)[String(formValue.paymentMethod)] ?? formValue.paymentMethod;
      })(),
      customerType: formValue.customerType,
      customerId: customer?.id,
      customerName: formValue.customerName.trim(),
      reservedByNationalId: formValue.reservedByNationalId?.trim() || undefined,
      carId: vehicle.id,
      carDescription: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      vehiclePlateNumber: vehicle.plateNumber,
      vehicleChassisNumber: vehicle.chassisNumber || vehicle.vin,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      vehicleColor: vehicle.exteriorColor,
      agreedSellingPrice: Number(formValue.agreedSellingPrice),
      currency: formValue.currency,
      reservationValidityDays: Number(formValue.reservationValidityDays),
      finalInvoicePriceFixed: !!formValue.finalInvoicePriceFixed,
      isRefundable: formValue.isRefundable,
      referenceType: 'SALE_CONTRACT',
      referenceId: vehicle.id,
      notes: formValue.notes?.trim() || undefined,
      status: 'DRAFT',
      creditAccountId: formValue.creditAccountId,
      debitAccountId: formValue.debitAccountId
    };

    this.isSaving.set(true);

    this.depositService.addDeposit(newDeposit).pipe(
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: (result) => {
        const message = result.source === 'backend' 
          ? this.translate.instant('ACCOUNTS.DEPOSITS.FORM.SAVED')
          : this.translate.instant('ACCOUNTS.DEPOSITS.FORM.SAVED_OFFLINE');
        
        this.notificationService.showSuccess(message);
        this.router.navigate(['/accounts/deposits']);
      },
      error: (err) => {
        console.error('Save failed', err);
        this.notificationService.showError(extractErrorMessage(err, this.translate, 'ACCOUNTS.DEPOSITS.FORM.SAVE_FAILED'));
      }
    });
  }

  getVehicleIdentity(vehicle: Car | null): string {
    if (!vehicle) {
      return '';
    }

    return vehicle.chassisNumber || vehicle.vin || vehicle.plateNumber || '';
  }

  getVehicleLabel(vehicle: Car): string {
    const plate = vehicle.plateNumber || '-';
    const description = buildVehicleDescription(vehicle);
    return description ? `${plate} - ${description}` : plate;
  }

  getAccountLabel(account: Account): string {
    const name = this.translate.currentLang === 'ar' ? (account.accountNameAr || account.accountNameEn) : account.accountNameEn;
    return [account.accountCode, name].filter(Boolean).join(' - ');
  }

  trackByCustomer(index: number, customer: any): any {
    return customer.id;
  }

  trackByAccount(index: number, account: AccountNode): number {
    return account.id;
  }

  trackByVehicle(index: number, vehicle: any): any {
    return vehicle.id;
  }
}