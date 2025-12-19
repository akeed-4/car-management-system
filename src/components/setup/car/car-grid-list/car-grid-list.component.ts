import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Car } from '../../../../types/car.model';
import { InventoryService } from '../../../../services/inventory.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { CarDeclarationDialogComponent } from '../car-declaration-dialog/car-declaration-dialog.component';
import { CarDetailsDialogComponent } from '../car-details-dialog/car-details-dialog.component';

@Component({
  selector: 'app-car-grid-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatCheckboxModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './car-grid-list.component.html',
  styleUrls: ['./car-grid-list.component.css']
})
export class CarGridListComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  public translate = inject(TranslateService);

  cars = this.inventoryService.cars$;
  viewMode = signal<'grid' | 'list'>('grid');
  filter = signal('');
  statusFilter = signal<string>('all');
  conditionFilter = signal<string>('all');
  sortBy = signal<string>('createdAt');

  filteredCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const status = this.statusFilter();
    const condition = this.conditionFilter();
    let cars = this.cars();

    // Apply search filter
    if (searchTerm) {
      cars = cars.filter(car =>
        car.vin?.toLowerCase().includes(searchTerm) ||
        car.make?.toLowerCase().includes(searchTerm) ||
        car.model?.toLowerCase().includes(searchTerm) ||
        car.plateNumber?.toLowerCase().includes(searchTerm) ||
        car.year?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (status && status !== 'all') {
      cars = cars.filter(car => car.status === status);
    }

    // Apply condition filter
    if (condition && condition !== 'all') {
      cars = cars.filter(car => car.condition === condition);
    }

    // Apply sorting
    const sortField = this.sortBy();
    cars = [...cars].sort((a: any, b: any) => {
      if (sortField === 'salePrice') {
        return (b[sortField] || 0) - (a[sortField] || 0);
      }
      if (sortField === 'year') {
        return (b[sortField] || 0) - (a[sortField] || 0);
      }
      if (sortField === 'createdAt') {
        return new Date(b[sortField] || 0).getTime() - new Date(a[sortField] || 0).getTime();
      }
      return 0;
    });

    return cars;
  });

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.inventoryService.getCars().subscribe({
      next: () => {
        // Signal is updated in service
      },
      error: (error) => {
        console.error('Error loading cars:', error);
      }
    });
  }

  onCreate(): void {
    // Show declaration and signature dialog before allowing car creation
    this.showDeclarationDialog().subscribe(result => {
      if (result) {
        this.router.navigate(['/inventory/new']);
      }
    });
  }

  showDeclarationDialog(): Observable<boolean> {
    const dialogRef = this.dialog.open(CarDeclarationDialogComponent, {
      width: '600px',
      disableClose: true,
      data: {}
    });

    return dialogRef.afterClosed();
  }

  onViewCar(car: Car): void {
    this.dialog.open(CarDetailsDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: car,
      disableClose: false
    });
  }

  onEdit(car: Car): void {
    this.router.navigate(['/setup/card'], {
      queryParams: { id: car.id, mode: 'edit' }
    });
  }

  onDelete(car: Car): void {
    const message = this.translate.instant('CARS.CONFIRM_DELETE', { vin: car.vin });
    if (confirm(message)) {
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

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Available': 'success',
      'Reserved': 'warning',
      'Sold': 'default',
      'In Maintenance': 'info'
    };
    return colors[status] || 'default';
  }

  getConditionIcon(condition: string): string {
    return condition === 'New' ? 'new_releases' : 'directions_car';
  }

  getCarImage(car: Car): string {
    return car.imageUrl || 'assets/images/car-placeholder.png';
  }

  canEnterShowroom(car: Car): boolean {
    // Check if car has showroom entry permission
    return car.allowEntryToShowroom === true;
  }

  getShowroomStatus(car: Car): string {
    return this.canEnterShowroom(car) ? 'ALLOWED' : 'NOT_ALLOWED';
  }

  getShowroomStatusColor(car: Car): string {
    return this.canEnterShowroom(car) ? 'success' : 'warn';
  }

  clearFilters(): void {
    this.filter.set('');
    this.statusFilter.set('all');
    this.conditionFilter.set('all');
  }
}
