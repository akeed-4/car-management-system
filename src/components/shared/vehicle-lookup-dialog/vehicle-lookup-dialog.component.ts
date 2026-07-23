import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../../services/inventory.service';
import { Car } from '../../../models/car.model';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../../services/notification.service';

/**
 * Reusable vehicle-selection popup: search real inventory by VIN/plate/make/model/color/year,
 * pick a row, get the full Car back. Mirrors CustomerLookupModalComponent's interaction pattern
 * (filter form -> dx-data-grid single selection -> selected summary -> confirm/cancel), but
 * queries the backend's multi-field lookup endpoint instead of filtering a preloaded signal,
 * since inventory can be much larger than the customer list.
 *
 * Defaults to Available-only vehicles -- pass includeAllStatuses via MAT_DIALOG_DATA to lift
 * that if a future caller genuinely needs to see non-available cars too.
 */
@Component({
  selector: 'app-vehicle-lookup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    DxDataGridModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './vehicle-lookup-dialog.component.html',
  styleUrl: './vehicle-lookup-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleLookupDialogComponent {
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<VehicleLookupDialogComponent>);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);

  filterForm = new FormGroup({
    vin: new FormControl(''),
    plateNumber: new FormControl(''),
    make: new FormControl(''),
    model: new FormControl(''),
    exteriorColor: new FormControl(''),
    year: new FormControl<number | null>(null),
  });

  results = signal<Car[]>([]);
  loading = signal(false);
  hasSearched = signal(false);
  selectedVehicle = signal<Car | null>(null);

  search(): void {
    this.loading.set(true);
    const v = this.filterForm.value;
    this.inventoryService.lookupCars({
      vin: v.vin || undefined,
      plateNumber: v.plateNumber || undefined,
      make: v.make || undefined,
      model: v.model || undefined,
      exteriorColor: v.exteriorColor || undefined,
      year: v.year || undefined,
    }).subscribe({
      next: (cars) => {
        this.results.set(cars);
        this.hasSearched.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.results.set([]);
        this.hasSearched.set(true);
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('VEHICLE_LOOKUP.LOAD_ERROR'));
      }
    });
  }

  onVehicleSelect(car: Car | undefined): void {
    this.selectedVehicle.set(car ?? null);
  }

  confirmSelection(): void {
    if (this.selectedVehicle()) {
      this.dialogRef.close(this.selectedVehicle());
    }
  }

  /** Double-click a row: select it and close immediately, skipping the extra Select-button click. */
  onRowDoubleClick(car: Car | undefined): void {
    if (!car) return;
    this.selectedVehicle.set(car);
    this.dialogRef.close(car);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  resetFilters(): void {
    this.filterForm.reset();
    this.results.set([]);
    this.hasSearched.set(false);
    this.selectedVehicle.set(null);
  }
}
