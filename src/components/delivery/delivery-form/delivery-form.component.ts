import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryService } from '../../../services/delivery.service';
import { UserService } from '../../../services/user.service';
import { BranchContextService } from '../../../services/branch-context.service';
import { Customer } from '../../../models/customer.model';
import { Car } from '../../../models/car.model';
import { CustomerLookupModalComponent } from '../../shared/customer-lookup-modal/customer-lookup-modal.component';
import { VehicleLookupModalComponent } from '../../shared/vehicle-lookup-modal/vehicle-lookup-modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-delivery-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslateModule,
    MatTooltipModule,
  ],
  templateUrl: './delivery-form.component.html',
  styleUrl: './delivery-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deliveryService = inject(DeliveryService);
  private userService = inject(UserService);
  private branchContext = inject(BranchContextService);
  private dialog = inject(MatDialog);

  deliveryForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedCustomer = signal<Customer | null>(null);
  selectedCar = signal<Car | null>(null);

  drivers = this.userService.activeUsers$;

  statusOptions = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];

  ngOnInit() {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.currentId.set(id);
      this.editMode.set(true);
      this.deliveryService.getById(id).subscribe({
        next: (response) => {
          const delivery = response.data;
          this.deliveryForm.patchValue(delivery);
          this.selectedCustomer.set({
            id: delivery.customerId,
            name: delivery.customerName,
            phone: delivery.customerPhone,
          } as Customer);
          this.selectedCar.set({
            id: delivery.carId,
            make: delivery.carDescription?.split(' ')[0] ?? '',
            model: delivery.carDescription?.split(' ').slice(1).join(' ') ?? '',
            vin: delivery.carVin ?? '',
          } as Car);
        },
        error: () => {
          this.router.navigate(['/deliveries']);
        },
      });
    }
  }

  private initForm() {
    this.deliveryForm = new FormGroup({
      customerId: new FormControl<number | null>(null, Validators.required),
      carId: new FormControl<number | null>(null, Validators.required),
      driverId: new FormControl<number | null>(null),
      deliveryDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      deliveryTime: new FormControl('10:00', Validators.required),
      status: new FormControl('Scheduled'),
      documentsReady: new FormControl(false),
      insuranceReady: new FormControl(false),
      registrationReady: new FormControl(false),
      customerConfirmed: new FormControl(false),
      notes: new FormControl(''),
    });
  }

  openCustomerLookup(): void {
    const ref = this.dialog.open(CustomerLookupModalComponent, { width: '900px', panelClass: 'responsive-dialog-panel' });
    ref.afterClosed().subscribe((customer: Customer | null) => {
      if (customer) {
        this.selectedCustomer.set(customer);
        this.deliveryForm.patchValue({ customerId: customer.id });
      }
    });
  }

  openVehicleLookup(): void {
    const ref = this.dialog.open(VehicleLookupModalComponent, { width: '1000px', panelClass: 'responsive-dialog-panel' });
    ref.afterClosed().subscribe((car: Car | null) => {
      if (car) {
        this.selectedCar.set(car);
        this.deliveryForm.patchValue({ carId: car.id });
      }
    });
  }

  saveDelivery() {
    if (this.deliveryForm.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);

    const formValue = this.deliveryForm.value;

    if (this.editMode() && this.currentId()) {
      this.deliveryService.update(this.currentId()!, formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/deliveries']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      // Branch is no longer a user-facing field on this form -- always the caller's current
      // branch (BranchContextService), never a manual choice. Null when no branch is selected
      // (e.g. the caller's company has zero branches configured), same as the field's prior default.
      const createDto = { ...formValue, branchId: this.branchContext.current()?.branchId ?? null, createdBy: 1 };
      this.deliveryService.create(createDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/deliveries']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  openHistory(): void {
    const id = this.currentId();
    if (!id) return;
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'DeliverySchedule', entityId: id },
      width: '600px',
      panelClass: 'responsive-dialog-panel',
    });
  }

  trackByUser(index: number, user: { id: number }): number {
    return user.id;
  }
}
