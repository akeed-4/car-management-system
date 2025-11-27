import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ManufacturerService } from '../../../services/manufacturer.service';
import { Manufacturer } from '../../../types/manufacturer.model';
import { ModalComponent } from '../../shared/modal/modal.component'; // Corrected import path

type SortColumn = keyof Manufacturer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-manufacturers',
  standalone: true,
  imports: [FormsModule, ModalComponent],
  templateUrl: './manufacturers.component.html',
  styleUrl: './manufacturers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManufacturersComponent {
  private manufacturerService = inject(ManufacturerService);

  manufacturers = this.manufacturerService.manufacturers$;
  newManufacturerName = signal('');
  
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedManufacturers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let manufacturers = this.manufacturers();

    // Filter
    if (searchTerm) {
      manufacturers = manufacturers.filter(manufacturer => 
        manufacturer.name.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      manufacturers = [...manufacturers].sort((a, b) => {
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

    return manufacturers;
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

  addManufacturer(): void {
    const name = this.newManufacturerName().trim();
    if (name) {
      this.manufacturerService.addManufacturer({ name });
      this.newManufacturerName.set('');
    }
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.manufacturerService.deleteManufacturer(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}