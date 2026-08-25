import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../../../services/supplier.service';
import { Router, RouterModule } from '@angular/router';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Supplier } from '../../../../models/supplier.model';
import { FormsModule } from '@angular/forms';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';


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
    SharedDataGridComponent,
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
  private translate = inject(TranslateService);

  suppliers = this.supplierService.suppliers$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  /** Config-driven columns for the Shared DataGrid -- same fields/lookups/
   *  visibility the inline dxi-column definitions used before (captions are
   *  i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'name', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.NAME' },
    { dataField: 'crNumber', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.CR_NUMBER', width: 150 },
    { dataField: 'phone', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.PHONE', width: 140 },
    { dataField: 'phone2', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.SECONDARY_PHONE', width: 140, visible: false },
    { dataField: 'email', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.EMAIL', visible: false },
    {
      dataField: 'supplierCategory', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.CATEGORY',
      lookup: {
        dataSource: [
          { value: 'Parts', displayExpr: this.translate.instant('SUPPLIERS.CATEGORY_PARTS') },
          { value: 'Vehicles', displayExpr: this.translate.instant('SUPPLIERS.CATEGORY_VEHICLES') },
          { value: 'Services', displayExpr: this.translate.instant('SUPPLIERS.CATEGORY_SERVICES') },
          { value: 'Equipment', displayExpr: this.translate.instant('SUPPLIERS.CATEGORY_EQUIPMENT') },
        ],
        valueExpr: 'value',
        displayExpr: 'displayExpr',
      },
    },
    { dataField: 'address', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.ADDRESS', width: 200 },
    { dataField: 'city', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.CITY', visible: false },
    {
      dataField: 'paymentTerms', dataType: 'string', caption: 'SUPPLIERS.COLUMNS.PAYMENT_TERMS', visible: false,
      lookup: {
        dataSource: [
          { value: 'Cash', displayExpr: this.translate.instant('SUPPLIERS.PAYMENT_CASH') },
          { value: 'Net 15', displayExpr: this.translate.instant('SUPPLIERS.PAYMENT_NET_15') },
          { value: 'Net 30', displayExpr: this.translate.instant('SUPPLIERS.PAYMENT_NET_30') },
          { value: 'Net 60', displayExpr: this.translate.instant('SUPPLIERS.PAYMENT_NET_60') },
          { value: 'Net 90', displayExpr: this.translate.instant('SUPPLIERS.PAYMENT_NET_90') },
        ],
        valueExpr: 'value',
        displayExpr: 'displayExpr',
      },
    },
    { dataField: 'creditLimit', dataType: 'number', format: 'currency', caption: 'SUPPLIERS.COLUMNS.CREDIT_LIMIT', visible: false },
    { dataField: 'isActive', dataType: 'boolean', type: 'status', trueText: 'SUPPLIERS.STATUS.ACTIVE', falseText: 'SUPPLIERS.STATUS.INACTIVE', caption: 'SUPPLIERS.COLUMNS.STATUS', width: 100 },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'SUPPLIERS.COLUMNS.ACTIONS', width: 120, allowSorting: false, allowFiltering: false },
  ];

  /** Already-authorized actions (same edit/delete buttons as before). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'SUPPLIERS.ACTIONS.EDIT' },
    { id: 'delete', icon: 'trash', labelKey: 'SUPPLIERS.ACTIONS.DELETE', cssClass: 'btn-danger' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const supplier = e.row as Supplier;
    if (e.actionId === 'edit') this.editSupplier(supplier.id!);
    else if (e.actionId === 'delete') this.requestDelete(supplier.id!);
  }

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