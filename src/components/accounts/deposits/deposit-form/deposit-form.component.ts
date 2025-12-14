import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { DepositService } from '../../../../services/deposit.service';
import { DepositVoucher } from '../../../../types/deposit-voucher.model';
import { Car } from '../../../../types/car.model';
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

@Component({
  selector: 'app-deposit-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
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
    MatTooltipModule
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

  selectedCarDetails = signal<Car | undefined>(undefined);

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
      customer: new FormControl(null, Validators.required),
      car: new FormControl(null, Validators.required),
      amount: new FormControl(0, [Validators.required, Validators.min(0.01)]),
      notes: new FormControl('')
    });
  }

  onCarChange(carId: number | null) {
    if (carId) {
      this.inventoryService.getCarById(carId).subscribe(car => this.selectedCarDetails.set(car));
    } else {
      this.selectedCarDetails.set(undefined);
    }
  }

  saveDeposit() {
    if (this.depositForm.invalid) {
      return;
    }

    const formValue = this.depositForm.value;
    const customer = this.customers().find(c => c.id === formValue.customer);
    const car = this.selectedCarDetails();

    if (!customer || !car) {
      const translate = inject(TranslateService);
      alert(translate.instant('ACCOUNTS.DEPOSITS.FORM.FILL_REQUIRED'));
      return;
    }

    const newDeposit: Omit<DepositVoucher, 'id'> = {
      voucherNumber: formValue.voucherNumber,
      date: formValue.date,
      customerId: customer.id,
      customerName: customer.name,
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
      amount: formValue.amount,
      notes: formValue.notes,
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

  trackByCar(index: number, car: any): any {
    return car.id;
  }
}