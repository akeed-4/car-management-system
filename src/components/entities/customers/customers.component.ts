import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CustomerService } from '../../../services/customer.service';
import { Router, RouterLink } from '@angular/router';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Customer } from '../../../types/customer.model';
import { FormsModule } from '@angular/forms';
import {
  DxDataGridModule,
  DxButtonModule,
  DxLoadPanelModule,
  DxScrollViewModule
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

type SortColumn = keyof Customer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    RouterLink,
    ModalComponent,
    FormsModule,
    DxDataGridModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxScrollViewModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomersComponent {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  
  customers = this.customerService.customers$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedCustomers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let customers = this.customers();

    // Filter
    if (searchTerm) {
      customers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.nationalId.toLowerCase().includes(searchTerm) ||
        customer.phone.toLowerCase().includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      customers = [...customers].sort((a, b) => {
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

    return customers;
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


  editCustomer(id: number): void {
    this.router.navigate(['/entities/customers/edit', id]);
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      this.customerService.deleteCustomer(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}