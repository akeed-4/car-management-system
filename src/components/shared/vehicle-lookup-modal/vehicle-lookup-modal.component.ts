import { ChangeDetectionStrategy, Component, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedDataGridComponent } from '../shared-data-grid/shared-data-grid.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InventoryService } from '../../../services/inventory.service';
import { Car } from '../../../models/car.model';
import { buildVehicleDescription } from '../../../models/vehicle-description';
import { dataGridColumnDto } from '../../../models/grid.model';

@Component({
  selector: 'app-vehicle-lookup-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    SharedDataGridComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './vehicle-lookup-modal.component.html',
  styleUrl: './vehicle-lookup-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehicleLookupModalComponent {
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<VehicleLookupModalComponent>);

  // Available vehicles from service
  availableVehicles = this.inventoryService.availableVehicles$;

  // Display value functions for grid columns (declared before `columns`, which uses them)
  getDisplayVin = (rowData: Car) => rowData.vin || '-';
  getDisplayModel = (rowData: Car) => buildVehicleDescription({ make: rowData.make, model: rowData.model });
  getDisplayColor = (rowData: Car) => rowData.exteriorColor || '-';
  getDisplayPrice = (rowData: Car) => {
    if (!rowData.salePrice) return '-';
    return rowData.salePrice.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' });
  };
  getDisplayStatus = (rowData: Car) => 'SALES_INVOICE.VEHICLE_STATUS_AVAILABLE';

  /** Config-driven columns -- same computed display values as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'vin', dataType: 'string', caption: 'SALES_INVOICE.VIN', width: 120, calculateDisplayValue: this.getDisplayVin },
    { dataField: 'make', dataType: 'string', caption: 'SALES_INVOICE.MANUFACTURER' },
    { dataField: 'model', dataType: 'string', caption: 'SALES_INVOICE.MODEL' },
    { dataField: 'year', dataType: 'number', caption: 'SALES_INVOICE.YEAR', width: 80, alignment: 'center' },
    { dataField: 'exteriorColor', dataType: 'string', caption: 'SALES_INVOICE.COLOR', calculateDisplayValue: this.getDisplayColor },
    { dataField: 'salePrice', dataType: 'number', format: '#,##0', caption: 'SALES_INVOICE.SUGGESTED_PRICE', calculateDisplayValue: this.getDisplayPrice },
  ];

  // Filter state
  filterForm = new FormGroup({
    vinSearch: new FormControl(''),
    modelFilter: new FormControl(''),
    yearFilter: new FormControl(''),
    minPrice: new FormControl<number | null>(null),
    maxPrice: new FormControl<number | null>(null),
  });

  // Extract unique models and years for dropdowns
  uniqueModels = computed(() => {
    const models = this.availableVehicles().map(v => v.model);
    return [...new Set(models)].filter(m => m).sort();
  });

  uniqueYears = computed(() => {
    const years = this.availableVehicles().map(v => v.year);
    return [...new Set(years)].filter(y => y).sort().reverse();
  });

  // Filtered vehicles based on search/filters
  filteredVehicles = computed(() => {
    let vehicles = this.availableVehicles();
    const filters = this.filterForm.value;

    // VIN search
    if (filters.vinSearch?.trim()) {
      const vinLower = filters.vinSearch.toLowerCase();
      vehicles = vehicles.filter(v => v.vin?.toLowerCase().includes(vinLower));
    }

    // Model filter
    if (filters.modelFilter) {
      vehicles = vehicles.filter(v => v.model === filters.modelFilter);
    }

    // Year filter
    if (filters.yearFilter) {
      vehicles = vehicles.filter(v => v.year === parseInt(filters.yearFilter));
    }

    // Price range filter
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      vehicles = vehicles.filter(v => (v.salePrice ?? 0) >= filters.minPrice!);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      vehicles = vehicles.filter(v => (v.salePrice ?? 0) <= filters.maxPrice!);
    }

    return vehicles;
  });

  selectedVehicle = signal<Car | null>(null);

  // Display columns for DataGrid
  displayedColumns = ['vin', 'make', 'model', 'year', 'exteriorColor', 'salePrice', 'status'];

  onVehicleSelect(selectedVehicle: Car) {
    this.selectedVehicle.set(selectedVehicle);
  }

  confirmSelection() {
    if (this.selectedVehicle()) {
      this.dialogRef.close(this.selectedVehicle());
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }

  resetFilters() {
    this.filterForm.reset();
    this.selectedVehicle.set(null);
  }
}
