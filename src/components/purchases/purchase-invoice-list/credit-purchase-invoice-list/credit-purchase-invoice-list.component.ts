import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PurchaseInvoice } from '../../../../models/purchase-invoice.model';
import { FormsModule } from '@angular/forms';
import { PurchasesService } from '../../../../services/purchases.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

type SortColumn = keyof PurchaseInvoice | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-credit-purchase-invoice-list',
  standalone: true,
  imports: [RouterLink, FormsModule, TranslateModule, DxDataGridModule],
  templateUrl: './credit-purchase-invoice-list.component.html',
  styleUrl: './credit-purchase-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreditPurchaseInvoiceListComponent {
    private procurementService = inject(PurchasesService);
  private translate = inject(TranslateService);
  private router = inject(Router);
    invoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });

    filter = signal('');
    sortColumn = signal<SortColumn>('');
    sortDirection = signal<SortDirection>('');
    showArchived = signal(false);

    filteredAndSortedInvoices = computed(() => {
      const searchTerm = this.filter().toLowerCase();
      const column = this.sortColumn();
      const direction = this.sortDirection();
      const showArchived = this.showArchived();

      let invoices = this.invoices().filter(inv => !!inv.isArchived === showArchived);

      // Filter for credit invoices only
      invoices = invoices.filter(inv => inv.paymentType === 'credit');

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

    archiveInvoice(data: any) {
      this.procurementService.archiveInvoice(data.row.data.id);
    }

    unarchiveInvoice(data: any) {
      this.procurementService.unarchiveInvoice(data.row.data.id);
    }

    deleteInvoice(data: any) {
      const id = data.row.data.id;
      if (confirm(this.translate.instant('PURCHASES.DELETE_INVOICE_CONFIRM'))) {
        this.procurementService.deleteInvoice(id).subscribe({
          next: () => {
            // Refresh the invoices list
            this.invoices = toSignal(this.procurementService.getInvoices(), { initialValue: [] });
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
      window.open(`/purchases/invoice/print/${e.row.data.id}`, '_blank');
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
      window.open(`/purchases/invoice/print/${data.row.data.id}`, '_blank');
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