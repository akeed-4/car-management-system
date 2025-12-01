import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { InventoryService } from '../../../../services/inventory.service';
import { DepositService } from '../../../../services/deposit.service';
import { DepositVoucher } from '../../../../types/deposit-voucher.model';
import { Car } from '../../../../types/car.model';

@Component({
  selector: 'app-deposit-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './deposit-form.component.html',
  styleUrl: './deposit-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositFormComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  // Fix: Explicitly typed customerService to resolve 'unknown' type inference.
  private customerService: CustomerService = inject(CustomerService);
  // Fix: Explicitly typed inventoryService to resolve 'unknown' type inference.
  private inventoryService: InventoryService = inject(InventoryService);
  // Fix: Explicitly typed depositService to resolve 'unknown' type inference.
  private depositService: DepositService = inject(DepositService);

  customers = this.customerService.customers$;
  
  // Only show reserved cars that don't already have a deposit voucher
  availableReservedCars = computed(() => {
    const allCars = this.inventoryService.cars$();
    const deposits = this.depositService.deposits$();
    const reservedCars = allCars.filter(car => car.status === 'Reserved');
    
    // Filter out cars that already have a deposit voucher
    return reservedCars.filter(car => !deposits.some(d => d.carId === car.id));
  });

  voucherNumber = signal(`DP-${Date.now()}`);
  date = signal(new Date().toISOString().split('T')[0]);
  selectedCustomerId = signal<number | null>(null);
  selectedCarId = signal<number | null>(null);
  amount = signal(0);
  notes = signal('');

  selectedCarDetails = computed<Car | undefined>(() => {
    const carId = this.selectedCarId();
    if (!carId) return undefined;
    // Fix: inventoryService is now correctly typed, allowing getCarById access.
    return this.inventoryService.getCarById(carId);
  });

  constructor() {
    effect(() => {
      const carIdParam = this.route.snapshot.params['carId'];
      if (carIdParam) {
        const carId = Number(carIdParam);
        this.selectedCarId.set(carId);
        // Prefill customer if the car is reserved and we know the customer
        // (This part would typically be more complex, e.g., if sales invoice exists)
        // For now, we'll let the user select customer manually or leave as an exercise.
      }
    }, { allowSignalWrites: true });
  }

  onCarChange(carId: number | null) {
    this.selectedCarId.set(carId);
    // Optionally pre-fill amount if a default deposit percentage is configured
    // For now, leave at 0.
  }

  saveDeposit() {
    const customer = this.customers().find(c => c.id === this.selectedCustomerId());
    const car = this.selectedCarDetails();
    const depositAmount = this.amount();

    if (!customer || !car || depositAmount <= 0) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة بشكل صحيح.');
      return;
    }

    const newDeposit: Omit<DepositVoucher, 'id'> = {
      voucherNumber: this.voucherNumber(),
      date: this.date(),
      customerId: customer.id,
      customerName: customer.name,
      carId: car.id,
      carDescription: `${car.make} ${car.model} (${car.year})`,
      amount: depositAmount,
      notes: this.notes(),
    };

    // Fix: depositService is now correctly typed, allowing addDeposit access.
    this.depositService.addDeposit(newDeposit);
    alert('تم إصدار سند العربون بنجاح.');
    this.router.navigate(['/accounts/deposits']);
  }
}