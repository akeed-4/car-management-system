import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { DepositService } from '../../../../services/deposit.service';
import { TreasuryService } from '../../../../services/treasury.service';
import { Car } from '../../../../models/car.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { AdvancePaymentVoucher } from '@/src/models/advancePaymentVoucher.model';

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
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule
  ],
  templateUrl: './deposit-form.component.html',
  styleUrl: './deposit-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Fix: Explicitly typed customerService to resolve 'unknown' type inference.
  private customerService: CustomerService = inject(CustomerService);
  // Fix: Explicitly typed inventoryService to resolve 'unknown' type inference.
  private inventoryService: InventoryService = inject(InventoryService);
  // Fix: Explicitly typed depositService to resolve 'unknown' type inference.
  private depositService: DepositService = inject(DepositService);
  private treasuryService: TreasuryService = inject(TreasuryService);

  depositForm!: FormGroup;

  customers = this.customerService.customers$;
  
  // Only show reserved cars that don't already have a deposit voucher
  availableReservedCars = computed(() => {
    const allCars = this.inventoryService.cars$();
    const deposits = this.depositService.deposits$();
    const reservedCars = allCars.filter(car => car.status === 'Reserved');
    
    // Filter out cars that already have a deposit voucher
    return reservedCars.filter(car => !deposits.some(d => d.carId === car.id));
  });

  accounts = this.treasuryService.accounts$;
  
  selectedCustomer = computed(() => {
    const customerId = this.depositForm.get('customerId')?.value;
    if (!customerId) return null;
    return this.customers().find(c => c.id === customerId);
  });

  selectedVehicle = computed(() => {
    const vehicleId = this.depositForm.get('vehicleId')?.value;
    if (!vehicleId) return null;
    return this.availableReservedCars().find(v => v.id === vehicleId);
  });

  ngOnInit() {
    this.initForm();
    
    // Handle route params for pre-filling car
    const carIdParam = this.route.snapshot.params['carId'];
    if (carIdParam) {
      const carId = Number(carIdParam);
      this.depositForm.patchValue({ car: carId });
      this.onCarChange(carId);
    }
  }

  private initForm() {
    this.depositForm = new FormGroup({
      voucherNumber: new FormControl(`DP-${Date.now()}`),
      date: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      customerId: new FormControl(null, Validators.required),
      vehicleId: new FormControl(null, Validators.required),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      paymentMethod: new FormControl('CASH', Validators.required),
      accountId: new FormControl(null, Validators.required),
      isRefundable: new FormControl(true),
      notes: new FormControl('')
    });
  }

  onCarChange(carId: number | null) {
    // This method is now handled by the computed signal selectedVehicle
  }

  saveDeposit() {
    if (this.depositForm.invalid) {
      return;
    }

    const formValue = this.depositForm.value;
    const customer = this.selectedCustomer();
    const vehicle = this.selectedVehicle();
    const account = this.accounts().find(a => a.id === formValue.accountId);

    if (!customer || !vehicle || !account || formValue.amount <= 0) {
      const translate = inject(TranslateService);
      alert(translate.instant('ACCOUNTS.DEPOSITS.FORM.FILL_REQUIRED'));
      return;
    }

    const newDeposit: Omit<AdvancePaymentVoucher, 'id'> = {
      voucherNumber: formValue.voucherNumber,
      voucherType: 'DEPOSIT',
      date: new Date(formValue.date),
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      accountId: account.id,
      accountName: account.name,
      customerId: customer.id,
      customerName: customer.name,
      carId: vehicle.id,
      carDescription: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      isRefundable: formValue.isRefundable,
      referenceType: 'SALE_CONTRACT',
      referenceId: vehicle.id,
      notes: formValue.notes,
      status: 'DRAFT',
      createdBy: 1, // TODO: Get from current user service
      createdAt: new Date()
    };

    // Fix: depositService is now correctly typed, allowing addDeposit access.
    this.depositService.addDeposit(newDeposit);
    const translate = inject(TranslateService);
    alert(translate.instant('ACCOUNTS.DEPOSITS.FORM.SAVED'));
    this.router.navigate(['/accounts/deposits']);
  }

  trackByCustomer(index: number, customer: any): any {
    return customer.id;
  }

  trackByVehicle(index: number, vehicle: any): any {
    return vehicle.id;
  }

  trackByAccount(index: number, account: any): any {
    return account.id;
  }
}