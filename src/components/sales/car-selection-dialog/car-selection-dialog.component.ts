import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../../services/sales.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { StoreCarStockDto } from '../../../models/store-car-stock.model';
import { Car } from '../../../models/car.model';
import { buildVehicleDescription } from '../../../models/vehicle-description';

export interface SalesCarSelectionCard extends StoreCarStockDto {
  imageUrl: string;
  specs: string;
}

export interface SalesCarSelectionDialogData {
  storeId?: number;
  /** Accepts either shape: full inventory Car[] (e.g. deposit-form, which isn't scoped to a
   * store's stock) or StoreCarStockDto[] (e.g. any future store-scoped caller). Normalized to a
   * single internal card shape in ngOnInit regardless of which was supplied. */
  cars?: (Car | StoreCarStockDto)[];
}

@Component({
  selector: 'app-car-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './car-selection-dialog.component.html',
  styleUrl: './car-selection-dialog.component.css'
})
export class CarSelectionDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<CarSelectionDialogComponent, SalesCarSelectionCard | undefined>);
  data = inject<SalesCarSelectionDialogData>(MAT_DIALOG_DATA);
  salesService = inject(SalesService);
  currentSettingService = inject(CurrentSettingService);

  searchTerm = signal('');
  cars = signal<SalesCarSelectionCard[]>([]);
  isLoading = signal(false);

  filteredCars = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const carsList = this.cars();
    return carsList.filter(car => car.carName?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    // If cars are provided in data, use them
    if (this.data?.cars && this.data.cars.length > 0) {
      this.cars.set(this.data.cars.map(car => this.toCard(this.normalize(car))));
    } else {
      // Otherwise, load cars from API based on current store
      this.loadCarsFromAPI();
    }
  }

  /** A caller may pass full inventory Car objects (not scoped to any one store's stock) instead
   * of StoreCarStockDto. Normalizes either into the one shape toCard()/the template expects. */
  private normalize(input: Car | StoreCarStockDto): StoreCarStockDto {
    if ('carId' in input) {
      return input;
    }
    return {
      id: input.id,
      storeId: 0,
      storeName: '',
      carId: input.id,
      carName: buildVehicleDescription(input),
      carDescription: input.description ?? '',
      availableQuantity: input.quantity ?? 0,
      quantity: input.quantity ?? 0,
      reservedQuantity: 0,
      lastUpdatedAt: '',
      salesPrice: input.salePrice,
      make: input.make,
      model: input.model,
      year: input.year,
      vin: input.vin,
      plateNumber: input.plateNumber,
    };
  }

  private toCard(car: StoreCarStockDto): SalesCarSelectionCard {
    return {
      ...car,
      imageUrl: '/assets/images/car.jpg',
      // carName/carDescription come straight from the backend now (StoreCarStockDto.CarName is
      // server-computed via VehicleDescriptionBuilder); specs falls back to the same builder here
      // only in case the backend field is ever blank, never to raw make/model/year concatenation.
      specs: car.carDescription || buildVehicleDescription(car) || car.carName,
    };
  }

  loadCarsFromAPI(): void {
    this.isLoading.set(true);
    // Get current store from settings or data
    const storeId = this.data?.storeId || this.currentSettingService.getStoreId() || 1;
    if (storeId) {
      this.salesService.getAvailableCarsByStore(storeId).subscribe({
        next: (response: unknown) => {
          const stocks = this.unwrapStocks(response);
          this.cars.set(stocks.map(car => this.toCard(car)));
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load cars from API', error);
          this.cars.set([]);
          this.isLoading.set(false);
        }
      });
    } else {
      console.warn('No store ID available for loading cars');
      this.cars.set([]);
      this.isLoading.set(false);
    }
  }

  /** Backend wraps this endpoint's payload in ApiResponse<T> despite its declared
   * ActionResult<IEnumerable<StoreCarStockDto>> signature; handle both shapes defensively. */
  private unwrapStocks(response: unknown): StoreCarStockDto[] {
    if (Array.isArray(response)) {
      return response;
    }
    const wrapped = response as { data?: StoreCarStockDto[] };
    return wrapped?.data ?? [];
  }

  selectCar(car: SalesCarSelectionCard) {
    this.dialogRef.close(car);
  }

  close() {
    this.dialogRef.close();
  }
}
