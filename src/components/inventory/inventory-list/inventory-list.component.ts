

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Car, CarCondition, CarLocation } from '../../../types/car.model';
import { FormsModule } from '@angular/forms'; // Import FormsModule for filter input
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
// Fix: Import InventoryService
import { InventoryService } from '../../../services/inventory.service';

type SortColumn = keyof Car | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ModalComponent, FormsModule, VinScannerComponent],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  // Fix: Injected Router service
  private router = inject(Router);

  cars = this.inventoryService.cars$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');
  showArchived = signal(false);
  conditionFilter = signal<'All' | 'New' | 'Used'>('All');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  // VIN Scanner Modal state
  isScannerOpen = signal(false);
  
  filteredAndSortedCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const showArchived = this.showArchived();
    const condition = this.conditionFilter();

    let cars = this.cars().filter(car => !!car.isArchived === showArchived);

    // Filter by Condition
    if (condition !== 'All') {
      cars = cars.filter(car => car.condition === condition);
    }
    
    // Filter by Search Term
    if (searchTerm) {
      cars = cars.filter(car => 
        car.make.toLowerCase().includes(searchTerm) ||
        car.model.toLowerCase().includes(searchTerm) ||
        car.year.toString().includes(searchTerm) ||
        car.vin.toLowerCase().includes(searchTerm) ||
        car.status.toLowerCase().includes(searchTerm) ||
        car.currentLocation.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      cars = [...cars].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return cars;
  });
  
  setConditionFilter(filter: 'All' | 'New' | 'Used') {
    this.conditionFilter.set(filter);
  }

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }
  
  onVinScanned(vin: string) {
    this.filter.set(vin);
    this.isScannerOpen.set(false);
  }

  onLocationChange(carId: number, event: Event) {
    this.inventoryService.updateCarLocation(carId, (event.target as HTMLInputElement).value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    if (this.sortDirection() === 'asc') return '▲';
    if (this.sortDirection() === 'desc') return '▼';
    return '';
  }

  editCar(id: number) {
    this.router.navigate(['/inventory/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const id = this.itemToDeleteId();
    if (id) {
      this.inventoryService.deleteCar(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  archiveCar(id: number) {
    this.inventoryService.archiveCar(id);
  }

  unarchiveCar(id: number) {
    this.inventoryService.unarchiveCar(id);
  }
}
