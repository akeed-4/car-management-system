import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseInvoice } from '../../../../models/purchase-invoice.model';
import { PurchasesService } from '../../../../services/purchases.service';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

type SortColumn = keyof PurchaseInvoice | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-cash-purchase-invoice-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslateModule, SharedDataGridComponent],
  templateUrl: './cash-purchase-invoice-list.component.html',
  styleUrl: './cash-purchase-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashPurchaseInvoiceListComponent {
    private procurementService = inject(PurchasesService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;
    invoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });
constructor() {
  this.onFilter = this.onFilter.bind(this);
  this.onSort = this.onSort.bind(this);
  this.deleteInvoice = this.deleteInvoice.bind(this);
  this.editInvoice = this.editInvoice.bind(this);
  this.printInvoice = this.printInvoice.bind(this);
  this.getinvoice()
}
    filter = signal('');
    sortColumn = signal<SortColumn>('');
    sortDirection = signal<SortDirection>('');
    showArchived = signal(false);

    filteredAndSortedInvoices = computed(() => {
      debugger
      const searchTerm = this.filter().toLowerCase();
      const column = this.sortColumn();
      const direction = this.sortDirection();
      const showArchived = this.showArchived();

      let invoices = this.invoices().filter(inv => !!inv.isArchived === showArchived);

      // Filter for cash invoices only
       invoices = invoices.filter(inv => inv.paymentType === 'cash');

      // Filter
      if (searchTerm) {
        invoices = invoices.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
          (invoice.supplier?.name || '').toLowerCase().includes(searchTerm) ||
          invoice.status.toLowerCase().includes(searchTerm) ||
          invoice.items.some(item => item.carDescription.toLowerCase().includes(searchTerm))
        );
      }

      // Sort
      if (column && direction) {
        invoices = [...invoices].sort((a, b) => {
          let aValue: any;
          let bValue: any;

          if (column === 'supplier') {
            aValue = a.supplier?.name || '';
            bValue = b.supplier?.name || '';
          } else if (column === 'invoiceDate') {
            aValue = new Date(a.invoiceDate);
            bValue = new Date(b.invoiceDate);
          } else if (column === 'totalAmount') {
            aValue = a.totalAmount;
            bValue = b.totalAmount;
          } else if (column === 'status') {
            aValue = a.status;
            bValue = b.status;
          } else if (column === 'amountPaid') { // Added for sorting
            aValue = a.amountPaid;
            bValue = b.amountPaid;
          } else if (column === 'amountDue') { // Added for sorting
            aValue = a.amountDue;
            bValue = b.amountDue;
          }
          else {
            aValue = a[column];
            bValue = b[column];
          }

          let comparison = 0;
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
          } else if (aValue instanceof Date && bValue instanceof Date) {
            comparison = aValue.getTime() - bValue.getTime();
          } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          }

          return direction === 'asc' ? comparison : -comparison;
        });
      }

      return invoices;
    });

    /** Custom cell templates ported from the original *dxTemplate blocks. */
    private supplierTpl = viewChild<TemplateRef<any>>('supplierTemplate');
    private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

    get cellTemplates(): Record<string, TemplateRef<any>> {
      const supplier = this.supplierTpl();
      const status = this.statusTpl();
      return {
        ...(supplier ? { supplierTemplate: supplier } : {}),
        ...(status ? { statusTemplate: status } : {}),
      };
    }

    /** Config-driven columns -- same fields/order/formats as before. */
    columns: dataGridColumnDto[] = [
      { dataField: 'invoiceNumber', dataType: 'string', caption: 'PURCHASES.INVOICE_NUMBER' },
      { dataField: 'invoiceDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PURCHASES.INVOICE_DATE' },
      { dataField: 'supplierName', dataType: 'string', caption: 'PURCHASES.SUPPLIER', cellTemplate: 'supplierTemplate' },
      { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'PURCHASES.TOTAL_COST' },
      { dataField: 'amountPaid', dataType: 'number', format: 'currency', caption: 'PURCHASES.AMOUNT_PAID', cssClass: 'text-success' },
      { dataField: 'amountDue', dataType: 'number', format: 'currency', caption: 'PURCHASES.AMOUNT_DUE', cssClass: 'text-danger' },
      { dataField: 'status', dataType: 'string', caption: 'PURCHASES.STATUS', cellTemplate: 'statusTemplate' },
      { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'PURCHASES.ACTIONS', width: 200, cssClass: 'no-print', allowSorting: false, allowFiltering: false },
    ];

    /** Same print/edit/delete/archive buttons as before (archive only when eligible). */
    rowActions: sharedGridRowActionDto[] = [
      { id: 'print', icon: 'print', labelKey: 'PURCHASES.PRINT_INVOICE' },
      { id: 'edit', icon: 'edit', labelKey: 'PURCHASES.EDIT_INVOICE' },
      { id: 'delete', icon: 'delete', labelKey: 'PURCHASES.DELETE_INVOICE', cssClass: 'warn' },
      { id: 'archive', icon: 'archive', labelKey: 'PURCHASES.ARCHIVE', visible: (row) => this.isArchiveButtonVisible({ row: { data: row } }) },
    ];

    onGridAction(e: SharedGridRowActionEvent): void {
      const wrapped = { row: { data: e.row } };
      if (e.actionId === 'print') this.onPrintClick(wrapped);
      else if (e.actionId === 'edit') this.onEditClick(wrapped);
      else if (e.actionId === 'delete') this.onDeleteClick(wrapped);
      else if (e.actionId === 'archive') this.onArchiveClick(wrapped);
    }

    // --- Mobile card-list rendering (see `isMobile` field comment above) ---
    mobileTitleOf = (inv: PurchaseInvoice) => inv.invoiceNumber;
    mobileTrackBy = (_index: number, inv: PurchaseInvoice) => inv.id;

    private formatCurrency = (value: number) => `${(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;

    mobileFields: MobileCardField<PurchaseInvoice>[] = [
      { label: 'PURCHASES.SUPPLIER', value: (inv) => inv.supplier?.name || 'N/A' },
      { label: 'PURCHASES.INVOICE_DATE', value: (inv) => new Date(inv.invoiceDate).toLocaleDateString() },
      { label: 'PURCHASES.TOTAL_COST', value: (inv) => this.formatCurrency(inv.totalAmount) },
      { label: 'PURCHASES.AMOUNT_PAID', value: (inv) => this.formatCurrency(inv.amountPaid) },
      { label: 'PURCHASES.AMOUNT_DUE', value: (inv) => this.formatCurrency(inv.amountDue) },
      { label: 'PURCHASES.STATUS', value: (inv) => inv.status },
    ];

    mobilePrint(inv: PurchaseInvoice): void {
      window.open(`/#/purchases/invoice/print/${inv.id}`, '_blank');
    }

    mobileEdit(inv: PurchaseInvoice): void {
      this.router.navigate(['/purchases/invoice/edit', inv.id]);
    }

    mobileDelete(inv: PurchaseInvoice): void {
      this.deleteInvoice(inv.id);
    }

    mobileArchive(inv: PurchaseInvoice): void {
      this.archiveInvoice(inv.id);
    }

    mobileCanArchive(inv: PurchaseInvoice): boolean {
      return !this.showArchived() && inv.status === 'Paid';
    }

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
getinvoice(){
  return this.invoices();
}
    getSortIcon(column: SortColumn) {
      if (this.sortColumn() !== column) return '';
      if (this.sortDirection() === 'asc') return '▲';
      if (this.sortDirection() === 'desc') return '▼';
      return '';
    }

    archiveInvoice(data: any) {
      this.procurementService.archiveInvoice(data.row.data.id);
    }

    unarchiveInvoice(data: any) {
      this.procurementService.unarchiveInvoice(data.row.data.id);
    }

    deleteInvoice(data: any) {
      const id = data;
      if (confirm(this.translate.instant('PURCHASES.DELETE_INVOICE_CONFIRM'))) {
        this.procurementService.deleteInvoice(id).subscribe({
          next: () => {
            // Refresh the invoices list
            this.invoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });
        alert(this.translate.instant('PURCHASES.DELETE_INVOICE_SUCCESS'));
          },
          error: (error) => {
            console.error('Error deleting invoice:', error);
            alert(this.translate.instant('PURCHASES.DELETE_INVOICE_ERROR'));
          }
        });
      }
    }

    // DevExtreme button click handlers
    onPrintClick = (e: any) => {
      // Opens the dedicated print route in its own tab so the printable page never inherits the
      // app's sidebar/toolbar -- see PrintablePurchaseInvoiceComponent.
      window.open(`/#/purchases/invoice/print/${e.row.data.id}`, '_blank');
    }

    onEditClick = (e: any) => {
      this.router.navigate(['/purchases/invoice/edit', e.row.data.id]);
    }

    onDeleteClick = (e: any) => {
      this.deleteInvoice(e.row.data.id);
    }

    onArchiveClick = (e: any) => {
      this.archiveInvoice(e.row.data.id);
    }

    onUnarchiveClick = (e: any) => {
      this.unarchiveInvoice(e.row.data.id);
    }

    isArchiveButtonVisible = (e: any) => {
      return !this.showArchived() && e.row.data.status === 'Paid';
    }

    isUnarchiveButtonVisible = (e: any) => {
      return this.showArchived();
    }


    printInvoice(data: any) {
      window.open(`/#/purchases/invoice/print/${data.row.data.id}`, '_blank');
    }

    editInvoice(data: any) {
      this.router.navigate(['/purchases/invoice/edit', data.row.data.id]);
    }

    shouldShowArchiveButton(data: any) {
      return !this.showArchived() && data.row.data.status === 'Paid';
    }

    shouldShowUnarchiveButton(data: any) {
      return this.showArchived();
    }
}
