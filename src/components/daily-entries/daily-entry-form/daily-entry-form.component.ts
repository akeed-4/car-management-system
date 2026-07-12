import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DailyEntryService } from '../../../services/daily-entry.service';
import { UserService } from '../../../services/user.service';
import { StoreService } from '../../../services/store.service';
import { Car } from '../../../models/car.model';
import { VehicleLookupModalComponent } from '../../shared/vehicle-lookup-modal/vehicle-lookup-modal.component';
import { AuditHistoryPanelComponent } from '../../shared/audit-history-panel/audit-history-panel.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-daily-entry-form',
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
    TranslateModule,
    MatTooltipModule,
  ],
  templateUrl: './daily-entry-form.component.html',
  styleUrl: './daily-entry-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyEntryFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dailyEntryService = inject(DailyEntryService);
  private userService = inject(UserService);
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);

  entryForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedCar = signal<Car | null>(null);

  employees = this.userService.activeUsers$;
  stores = this.storeService.stores$;

  typeOptions = ['Receiving', 'Delivery', 'Transfer', 'Return', 'Inspection', 'Maintenance'];
  statusOptions = ['Pending', 'Completed', 'Cancelled'];

  ngOnInit() {
    this.initForm();

    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      const id = Number(idParam);
      this.currentId.set(id);
      this.editMode.set(true);
      this.dailyEntryService.getById(id).subscribe({
        next: (response) => {
          const entry = response.data;
          this.entryForm.patchValue(entry);
          this.selectedCar.set({
            id: entry.carId,
            make: entry.carDescription?.split(' ')[0] ?? '',
            model: entry.carDescription?.split(' ').slice(1).join(' ') ?? '',
            vin: entry.carVin ?? '',
          } as Car);
        },
        error: () => {
          this.router.navigate(['/daily-entries']);
        },
      });
    }
  }

  private initForm() {
    this.entryForm = new FormGroup({
      entryType: new FormControl('Receiving', Validators.required),
      carId: new FormControl<number | null>(null, Validators.required),
      storeId: new FormControl<number | null>(null),
      employeeId: new FormControl<number | null>(null, Validators.required),
      entryDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      status: new FormControl('Completed', Validators.required),
      remarks: new FormControl(''),
    });
  }

  openVehicleLookup(): void {
    const ref = this.dialog.open(VehicleLookupModalComponent, { width: '1000px' });
    ref.afterClosed().subscribe((car: Car | null) => {
      if (car) {
        this.selectedCar.set(car);
        this.entryForm.patchValue({ carId: car.id });
      }
    });
  }

  saveEntry() {
    if (this.entryForm.invalid || this.saving()) {
      return;
    }
    this.saving.set(true);

    const formValue = this.entryForm.value;

    if (this.editMode() && this.currentId()) {
      this.dailyEntryService.update(this.currentId()!, formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/daily-entries']);
        },
        error: () => this.saving.set(false),
      });
    } else {
      const createDto = { ...formValue, createdBy: 1 };
      this.dailyEntryService.create(createDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/daily-entries']);
        },
        error: () => this.saving.set(false),
      });
    }
  }

  openHistory(): void {
    const id = this.currentId();
    if (!id) return;
    this.dialog.open(AuditHistoryPanelComponent, {
      data: { entityName: 'DailyEntry', entityId: id },
      width: '600px',
    });
  }

  trackByUser(index: number, user: { id: number }): number {
    return user.id;
  }

  trackByStore(index: number, store: { id: number }): number {
    return store.id;
  }
}
