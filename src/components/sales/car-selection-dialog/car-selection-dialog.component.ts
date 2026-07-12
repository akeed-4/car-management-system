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
  dialogRef = inject(MatDialogRef<CarSelectionDialogComponent>);
  data = inject(MAT_DIALOG_DATA);
  salesService = inject(SalesService);
  currentSettingService = inject(CurrentSettingService);

  searchTerm = signal('');
  cars = signal<any[]>([]);
  isLoading = signal(false);

  filteredCars = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const carsList = this.cars();
    return carsList.filter((car: any) => car.carName?.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    // If cars are provided in data, use them
    if (this.data?.cars && this.data.cars.length > 0) {
      this.cars.set(this.data.cars);
    } else {
      // Otherwise, load cars from API based on current store
      this.loadCarsFromAPI();
    }
  }

  loadCarsFromAPI(): void {
    debugger
    this.isLoading.set(true);
    // Get current store from settings or data
    const storeId = this.data?.storeId || this.currentSettingService.getStoreId() || 1;
    if (storeId) {
      this.salesService.getAvailableCarsByStore(storeId).subscribe({
        next: (availableStocks:any) => {
          const data =availableStocks.data;
          this.cars.set(data.map((car: any) => ({
            ...car,
            imageUrl: '/assets/images/car.jpg' ,
            carName: car.carName,
            specs: car.carDescription ,
            availableQuantity: car.availableQuantity
          })));
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

  selectCar(car: any) {
    this.dialogRef.close(car);
  }

  close() {
    this.dialogRef.close();
  }
}