import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SupplierService } from '../../../services/supplier.service';
import { Router, RouterLink } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Supplier } from '../../../types/supplier.model';
import { FormsModule } from '@angular/forms';

type SortColumn = keyof Supplier | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [RouterLink, ModalComponent, FormsModule],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersComponent {
  private supplierService = inject(SupplierService);
  private router = inject(Router);
  
  suppliers = this.supplierService.suppliers$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedSuppliers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let suppliers = this.suppliers();

    // Filter
    if (searchTerm) {
      suppliers = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.crNumber.toLowerCase().includes(searchTerm) ||
        supplier.phone.toLowerCase().includes(searchTerm) ||
        supplier.address.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      suppliers = [...suppliers].sort((a, b) => {
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

    return suppliers;
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

  editSupplier(id: number): void {
    this.router.navigate(['/entities/suppliers/edit', id]);
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.supplierService.deleteSupplier(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}