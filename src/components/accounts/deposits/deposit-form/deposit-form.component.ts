import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { DepositService } from '../../../../services/deposit.service';
import { Car } from '../../../../models/car.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { finalize, map, of, switchMap } from 'rxjs';

import { DepositVoucher, DepositPaymentMethod } from '@/src/models/deposit-voucher.model';
import { ChartOfAccountsService } from '../../../../services/chart-of-accounts.service';
import { AccountNode } from '../../../../models/account-node.model';
import { MatToolbarModule } from '@angular/material/toolbar';

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
    MatRadioModule
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
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  private chartOfAccountsService: ChartOfAccountsService = inject(ChartOfAccountsService);
  accounts = signal<AccountNode[]>([]);
  creditAccounts = computed(() => this.accounts().filter(a => a.type === 'ACCOUNT'));
  debitAccounts = computed(() => this.accounts().filter(a => a.type === 'ACCOUNT'));
  openCarSelectionDialog() {
    import('../../../../components/sales/car-selection-dialog/car-selection-dialog.component').then(({ CarSelectionDialogComponent }) => {
      const dialogRef = this.dialog.open(CarSelectionDialogComponent, {
        width: '900px',
        data: {
          cars: this.availableVehicles(),
        },
        autoFocus: true,
        disableClose: false
      });
      dialogRef.afterClosed().subscribe((selectedCar: any) => {
        if (selectedCar && selectedCar.id) {
          this.depositForm.patchValue({ vehicleId: selectedCar.id });
          this.selectedVehicleId.set(selectedCar.id);
        }
      });
    });
  }

  depositForm!: FormGroup;
  isSaving = signal(false);
  selectedCustomerId = signal<number | null>(null);
  selectedReservationHolderId = signal<number | null>(null);
  selectedVehicleId = signal<number | null>(null);
  vehicleSearch = signal('');

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

    // Load accounts for dropdowns
    this.chartOfAccountsService.accounts$.subscribe(accs => this.accounts.set(accs));

    const carIdParam = this.route.snapshot.params['carId'];
    if (carIdParam) {
      const carId = Number(carIdParam);
      this.depositForm.patchValue({ vehicleId: carId });
      this.selectedVehicleId.set(carId);
    }
  }

  private initForm() {
    this.depositForm = new FormGroup({
      voucherNumber: new FormControl(this.generateVoucherNumber(), Validators.required),
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
      alert(this.translate.instant('ACCOUNTS.DEPOSITS.FORM.FILL_REQUIRED'));
      return;
    }

    const newDeposit: Omit<DepositVoucher, 'id'> = {
      voucherNumber: formValue.voucherNumber,
      voucherType: 'DEPOSIT',
      date: new Date(formValue.date),
      amount: Number(formValue.depositAmount),
      paymentMethod: formValue.paymentMethod,
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
    };

    this.isSaving.set(true);
    this.depositService.addDeposit(newDeposit).pipe(
      switchMap(savedDeposit => {
        if (vehicle.status === 'Reserved') {
          return of(savedDeposit);
        }

        return this.inventoryService.updateCarStatus(vehicle.id, 'Reserved').pipe(
          map(() => savedDeposit)
        );
      }),
      finalize(() => this.isSaving.set(false))
    ).subscribe({
      next: () => {
        alert(this.translate.instant('ACCOUNTS.DEPOSITS.FORM.SAVED'));
        this.router.navigate(['/accounts/deposits']);
      },
      error: () => {
        alert(this.translate.instant('ACCOUNTS.DEPOSITS.FORM.ERROR_SAVING'));
      }
    });
  }

  private generateVoucherNumber(): string {
    return `DEP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  }

  getVehicleIdentity(vehicle: Car | null): string {
    if (!vehicle) {
      return '';
    }

    return vehicle.chassisNumber || vehicle.vin || vehicle.plateNumber || '';
  }

  getVehicleLabel(vehicle: Car): string {
    return `${vehicle.plateNumber || '-'} - ${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  }

  trackByCustomer(index: number, customer: any): any {
    return customer.id;
  }

  trackByVehicle(index: number, vehicle: any): any {
    return vehicle.id;
  }
}