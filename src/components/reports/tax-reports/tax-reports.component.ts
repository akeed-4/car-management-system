import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { FormsModule } from '@angular/forms';

type SortColumn = keyof SalesInvoice | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-tax-reports',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './tax-reports.component.html',
  styleUrl: './tax-reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxReportsComponent {
  private salesService = inject(SalesService);

  invoices = this.salesService.invoices$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  filteredAndSortedInvoices = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let invoices = this.invoices();

    // Filter
    if (searchTerm) {
      invoices = invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.customerName.toLowerCase().includes(searchTerm) ||
        invoice.invoiceDate.includes(searchTerm) // Simple date search
      );
    }

    // Sort
    if (column && direction) {
      invoices = [...invoices].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (column === 'invoiceDate') {
          aValue = new Date(a.invoiceDate);
          bValue = new Date(b.invoiceDate);
        } else if (column === 'customerName') {
          aValue = a.customerName;
          bValue = b.customerName;
        } else if (column === 'totalAmount' || column === 'subtotal' || column === 'vatAmount') {
          aValue = a[column];
          bValue = b[column];
        } else {
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


  totalSubtotal = computed(() =>
    this.filteredAndSortedInvoices().reduce((sum, inv) => sum + inv.subtotal, 0)
  );
  totalVatAmount = computed(() =>
    this.filteredAndSortedInvoices().reduce((sum, inv) => sum + inv.vatAmount, 0)
  );
  grandTotal = computed(() =>
    this.filteredAndSortedInvoices().reduce((sum, inv) => sum + inv.totalAmount, 0)
  );
}