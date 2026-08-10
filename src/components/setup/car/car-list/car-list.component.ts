import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Car } from '../../../../models/car.model';
import { InventoryService } from '../../../../services/inventory.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { CarDetailsDialogComponent } from '../car-details-dialog/car-details-dialog.component';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatGridListModule,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './car-list.component.html',
  styleUrls: ['./car-list.component.css']
})
export class CarListComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  cars = this.inventoryService.cars$;
  searchTerm = signal('');
  selectedBrand = signal('');
  selectedStatus = signal('');

  // Get unique brands and statuses for filters
  brands = computed(() => {
    const cars = this.cars();
    const uniqueBrands = [...new Set(cars.map(car => car.make).filter(Boolean))];
    return uniqueBrands.sort();
  });

  statuses = computed(() => {
    const cars = this.cars();
    const uniqueStatuses = [...new Set(cars.map(car => car.status).filter(Boolean))];
    return uniqueStatuses.sort();
  });

  filteredCars = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const brand = this.selectedBrand();
    const status = this.selectedStatus();
    const cars = this.cars();

    return cars.filter(car => {
      const matchesSearch = !search ||
        car.make?.toLowerCase().includes(search) ||
        car.model?.toLowerCase().includes(search) ||
        car.vin?.toLowerCase().includes(search);

      const matchesBrand = !brand || car.make === brand;
      const matchesStatus = !status || car.status === status;

      return matchesSearch && matchesBrand && matchesStatus;
    });
  });

  constructor() {
    this.onCreate = this.onCreate.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

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

  openCarDetails(car: Car): void {
    this.dialog.open(CarDetailsDialogComponent, {
      data: car,
      width: '90vw',
      maxWidth: '900px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: ['car-details-dialog-panel', 'responsive-dialog-panel']
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Available':
        return 'primary';
      case 'Sold':
        return 'warn';
      case 'Reserved':
        return 'accent';
      case 'In Maintenance':
        return 'basic';
      default:
        return 'basic';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Available':
        return 'check_circle';
      case 'Sold':
        return 'cancel';
      case 'Reserved':
        return 'schedule';
      case 'In Maintenance':
        return 'build';
      default:
        return 'help';
    }
  }

  getGridCols(): number {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 600) return 1;
      if (width < 900) return 2;
      if (width < 1200) return 3;
      return 4;
    }
    return 4;
  }

  trackByCarId(index: number, car: Car): number {
    return car.id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/assets/images/car-placeholder.svg';
  }
}