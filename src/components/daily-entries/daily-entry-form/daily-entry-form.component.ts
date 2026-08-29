import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DailyEntryService } from '../../../services/daily-entry.service';
import { UserService } from '../../../services/user.service';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { StoreContextService } from '../../../services/store-context.service';
import { resolveStoreDisplayName } from '../../../models/store-display.util';
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
    MatDialogModule,
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
  private dialog = inject(MatDialog);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private storeContext = inject(StoreContextService);

  entryForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedCar = signal<Car | null>(null);

  employees = this.userService.activeUsers$;
  /** Read-only label for the (no-longer-user-editable) Store field -- resolves the form's storeId
   *  against every store the caller is authorized for, so an edit-mode entry keeps showing its
   *  real, originally-saved store name even if that store isn't the caller's current one. This
   *  field stays optional (no Validators.required) -- a daily entry may legitimately have no
   *  associated store. */
  currentStoreName = computed(() => resolveStoreDisplayName(
    this.storeContext.memberships(),
    this.entryForm?.get('storeId')?.value ?? null,
    this.storeContext.current()?.nameAr,
  ));

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
          if (entry.storeId) {
            this.warnIfCurrentStoreNotConfigured(entry.storeId);
          }
        },
        error: () => {
          this.router.navigate(['/daily-entries']);
        },
      });
    } else {
      // Heads-up only: warns immediately if the current Showroom has no active
      // StoreAccountingConfiguration, instead of only finding out after Save fails server-side.
      const initialStoreId = this.entryForm.get('storeId')?.value;
      if (initialStoreId) {
        this.warnIfCurrentStoreNotConfigured(initialStoreId);
      }
    }
  }

  private initForm() {
    this.entryForm = new FormGroup({
      entryType: new FormControl('Receiving', Validators.required),
      carId: new FormControl<number | null>(null, Validators.required),
      // No Store picker anymore -- a new entry always belongs to the caller's current Showroom.
      storeId: new FormControl<number | null>(this.storeContext.current()?.storeId ?? null),
      employeeId: new FormControl<number | null>(null, Validators.required),
      entryDate: new FormControl(new Date().toISOString().split('T')[0], Validators.required),
      status: new FormControl('Completed', Validators.required),
      remarks: new FormControl(''),
    });
  }

  openVehicleLookup(): void {
    const ref = this.dialog.open(VehicleLookupModalComponent, { width: '1000px', panelClass: 'responsive-dialog-panel' });
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
      panelClass: 'responsive-dialog-panel',
    });
  }

  trackByUser(index: number, user: { id: number }): number {
    return user.id;
  }

  trackByStore(index: number, store: { id: number }): number {
    return store.id;
  }

  /** Called once the storeId is known (current Showroom for a new entry, saved value for an
   *  edit) -- there's no more Store dropdown to hang a (selectionChange) handler off of. */
  private warnIfCurrentStoreNotConfigured(storeId: number | null): void {
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, this.currentStoreName()).subscribe();
  }
}
