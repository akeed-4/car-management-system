import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../../../../services/customer.service';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Customer } from '../../../../models/customer.model';
import { FormsModule } from '@angular/forms';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { ToastService } from '../../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

type SortColumn = keyof Customer | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ModalComponent,
    FormsModule,
    SharedDataGridComponent,
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
  private toastService = inject(NotificationService);
  private translate = inject(TranslateService);

  // customers = this.customerService.customers$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  /** Config-driven columns for the Shared DataGrid -- same fields/visibility the
   *  inline dxi-column definitions used before (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'name', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.NAME' },
    { dataField: 'nationalId', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.NATIONAL_ID', width: 150 },
    { dataField: 'phone', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.PHONE', width: 140 },
    { dataField: 'phone2', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.SECONDARY_PHONE', width: 140, visible: false },
    { dataField: 'email', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.EMAIL', visible: false },
    { dataField: 'address', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.ADDRESS', width: 200 },
    { dataField: 'city', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.CITY', visible: false },
    { dataField: 'occupation', dataType: 'string', caption: 'CUSTOMERS.COLUMNS.OCCUPATION', visible: false },
    { dataField: 'monthlyIncome', dataType: 'number', format: 'currency', caption: 'CUSTOMERS.COLUMNS.MONTHLY_INCOME', visible: false },
    { dataField: 'creditScore', dataType: 'number', caption: 'CUSTOMERS.COLUMNS.CREDIT_SCORE', visible: false },
    { dataField: 'isActive', dataType: 'boolean', type: 'status', trueText: 'CUSTOMERS.STATUS.ACTIVE', falseText: 'CUSTOMERS.STATUS.INACTIVE', caption: 'CUSTOMERS.COLUMNS.STATUS', width: 100 },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'CUSTOMERS.COLUMNS.ACTIONS', width: 120, allowSorting: false, allowFiltering: false },
  ];

  /** Already-authorized actions (same edit/delete buttons as before). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'CUSTOMERS.ACTIONS.EDIT' },
    { id: 'delete', icon: 'trash', labelKey: 'CUSTOMERS.ACTIONS.DELETE', cssClass: 'btn-danger' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const customer = e.row as Customer;
    if (e.actionId === 'edit') this.editCustomer(customer.id!);
    else if (e.actionId === 'delete') this.requestDelete(customer.id!);
  }

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedCustomers = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let customers = this.customerService.customers$();

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
      this.customerService.deleteCustomer(id).subscribe({
        next: () => {
          this.toastService.showSuccess('TOAST.DELETE_SUCCESS');
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.toastService.showError(this.translate.instant('TOAST.SAVE_ERROR'));
        }
      });
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}