import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../../../services/supplier.service';
import { Router, RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Supplier } from '../../../../types/supplier.model';
import { FormsModule } from '@angular/forms';
import {
  DxDataGridModule,
  DxButtonModule,
  DxLoadPanelModule,
  DxScrollViewModule
} from 'devextreme-angular';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';


type SortColumn = keyof Supplier | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ModalComponent,
    FormsModule,
    DxDataGridModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxScrollViewModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuppliersComponent {
  private supplierService = inject(SupplierService);
  private router = inject(Router);

  constructor() {
    this.editSupplier = this.editSupplier.bind(this);
    this.requestDelete = this.requestDelete.bind(this);
  }
  
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

 



  editSupplier(event: any): void {
    const id = event.row.data.id;
    this.router.navigate(['/entities/suppliers/edit', id]);
  }

  requestDelete(event: any): void {
    const id = event.row.data.id;
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