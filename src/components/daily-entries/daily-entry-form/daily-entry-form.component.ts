import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DailyEntryService } from '../../../services/daily-entry.service';
import { UserService } from '../../../services/user.service';
import { StoreService } from '../../../services/store.service';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { warnIfStoreNotConfigured } from '../../shared/store-accounting-setup-warning-dialog/store-accounting-setup-warning.helper';
import { BranchContextService } from '../../../services/branch-context.service';
import { scopeStoresToCurrentBranch } from '../../../models/branch-scoped-stores.util';
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
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);
  private storeAccountingConfigService = inject(StoreAccountingConfigurationService);
  private branchContext = inject(BranchContextService);
  private injector = inject(Injector);

  entryForm!: FormGroup;
  editMode = signal(false);
  currentId = signal<number | null>(null);
  saving = signal(false);

  selectedCar = signal<Car | null>(null);

  employees = this.userService.activeUsers$;
  /** The form's current storeId, kept in sync explicitly (edit-load + onStoreSelectionChange) so
   *  the Store list can stay scoped to the caller's current branch without losing a document's
   *  already-saved store when editing across a branch boundary. */
  private currentStoreIdValue = signal<number | null>(null);
  /** Store dropdown options scoped to the caller's current branch -- never offers a store outside
   *  the user's assigned branch on a new entry, while still showing an already-saved out-of-branch
   *  store when editing one. This field stays optional (no Validators.required), so a "None" choice
   *  is preserved regardless of scoping -- see the template's own null option. */
  stores = computed(() => scopeStoresToCurrentBranch(
    this.storeService.stores$(),
    this.branchContext.current()?.branchId,
    this.currentStoreIdValue(),
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
          this.currentStoreIdValue.set(entry.storeId ?? null);
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
    } else {
      // Auto-select the store once the branch-scoped list resolves to exactly one option, so a
      // user whose branch has a single store never has to manually pick it. Only for a new
      // (never-saved) entry.
      effect(() => {
        const options = this.stores();
        const storeIdControl = this.entryForm.get('storeId');
        if (options.length === 1 && !storeIdControl?.value && !storeIdControl?.dirty) {
          storeIdControl?.setValue(options[0].id);
          this.onStoreSelectionChange(options[0].id);
        }
      }, { injector: this.injector });
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

  onStoreSelectionChange(storeId: number | null): void {
    this.currentStoreIdValue.set(storeId);
    const selectedStore = this.stores().find(s => s.id === storeId);
    warnIfStoreNotConfigured(this.storeAccountingConfigService, this.dialog, this.router, storeId, selectedStore?.nameEn ?? '').subscribe();
  }
}
