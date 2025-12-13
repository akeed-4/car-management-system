import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Car } from '../../../../types/car.model';
import { InventoryService } from '../../../../services/inventory.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.css']
})
export class CarListComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  cars = this.inventoryService.cars$;
  filter = signal('');
constructor() {
  this.onCreate=this.onCreate.bind(this);
  this.onEdit=this.onEdit.bind(this);
  this.onDelete=this.onDelete.bind(this);
}
  filteredCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const cars = this.cars();

    if (!searchTerm) {
      return cars;
    }

    return cars.filter(car =>
      car.vin?.toLowerCase().includes(searchTerm) ||
      car.make?.toLowerCase().includes(searchTerm) ||
      car.model?.toLowerCase().includes(searchTerm) ||
      car.year?.toString().includes(searchTerm)
    );
  });

  loadCars(): void {
    this.inventoryService.getCars().subscribe({
      next: (data) => {
        // Signal is updated in service
      },
      error: (error) => {
        console.error('Error loading cars:', error);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/setup/card']);
  }

  onEdit(car: Car): void {
    this.router.navigate(['/setup/card'], { queryParams: { id: car.id } });
  }

  onDelete(car: Car): void {
    if (confirm(`Are you sure you want to delete car "${car.vin}"?`)) {
      this.inventoryService.deleteCar(car.id).subscribe({
        next: () => {
          this.loadCars();
        },
        error: (error) => {
          console.error('Error deleting car:', error);
        }
      });
    }
  }

  onRowClick(event: any): void {
    if (event.data) {
      this.onEdit(event.data);
    }
  }
}