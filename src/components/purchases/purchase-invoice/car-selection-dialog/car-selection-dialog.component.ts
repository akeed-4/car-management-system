import { Component, inject, signal, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryService } from '../../../../services/inventory.service';
import { Car } from '../../../../models/car.model';
import { buildVehicleDescription } from '../../../../models/vehicle-description';

export interface PurchaseCarSelectionCard extends Car {
  imageUrl: string;
  carName: string;
  specs: string;
  availableQuantity: number;
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
    MatIconModule,
    MatCardModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './car-selection-dialog.component.html',
  styleUrl: './car-selection-dialog.component.css'
})
export class CarSelectionDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CarSelectionDialogComponent, PurchaseCarSelectionCard | undefined>);
  private inventoryService = inject(InventoryService);

  searchTerm = '';
  cars = signal<PurchaseCarSelectionCard[]>([]);
  filteredCars = signal<PurchaseCarSelectionCard[]>([]);

  constructor() {
    // Load cars and create card data
    const cars = this.inventoryService.cars$();
    const carCards: PurchaseCarSelectionCard[] = cars.map(car => ({
      ...car,
      imageUrl: car.photos?.[0] || 'https://via.placeholder.com/300x200?text=' + encodeURIComponent(buildVehicleDescription(car) || 'Vehicle'),
      carName: buildVehicleDescription(car),
      specs: `${car.year ?? ''} - ${car.mileage ?? 0} km`,
      availableQuantity: car.quantity || 0
    }));
    this.cars.set(carCards);
    this.filterCars();
  }

  ngOnInit() {
    // Initial filter
    this.filterCars();
  }

  filterCars() {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.cars().filter(car =>
      car.carName.toLowerCase().includes(term) ||
      car.specs.toLowerCase().includes(term)
    );
    this.filteredCars.set(filtered);
  }

  selectCar(car: PurchaseCarSelectionCard) {
    this.dialogRef.close(car);
  }

  close() {
    this.dialogRef.close();
  }
}
