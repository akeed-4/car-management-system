import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Car } from '../../../types/car.model';
import { FormsModule } from '@angular/forms'; // Import FormsModule for filter input

type SortColumn = keyof Car | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ModalComponent, FormsModule],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);

  cars = this.inventoryService.cars$;
  carQuantities = this.inventoryService.carQuantities$; // Access car quantities
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);
  
  // Computed signal to combine car data with its quantity for display
  carsWithQuantities = computed(() => {
    const cars = this.cars();
    const quantities = this.carQuantities();
    return cars.map(car => ({
      ...car,
      quantity: quantities.get(car.id) ?? 0 // Add quantity to each car object
    }));
  });

  filteredAndSortedCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let cars = this.carsWithQuantities(); // Use carsWithQuantities for filtering/sorting

    // Filter
    if (searchTerm) {
      cars = cars.filter(car => 
        car.make.toLowerCase().includes(searchTerm) ||
        car.model.toLowerCase().includes(searchTerm) ||
        car.year.toString().includes(searchTerm) ||
        car.vin.toLowerCase().includes(searchTerm) ||
        car.status.toLowerCase().includes(searchTerm)
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

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
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
}