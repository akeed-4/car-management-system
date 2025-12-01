import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../../services/receipt.service';
import { ReceiptVoucher } from '../../../types/receipt-voucher.model';

type SortColumn = keyof ReceiptVoucher | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent {
  private receiptService = inject(ReceiptService);
  
  receipts = this.receiptService.receipts$;
  filter = signal('');
  sortColumn = signal<SortColumn>('date');
  sortDirection = signal<SortDirection>('desc');

  filteredAndSortedReceipts = computed(() => {
    let receipts = this.receipts();
    const searchTerm = this.filter().toLowerCase();
    
    if (searchTerm) {
      receipts = receipts.filter(r => 
        r.voucherNumber.toLowerCase().includes(searchTerm) ||
        r.customerName.toLowerCase().includes(searchTerm) ||
        r.salesInvoiceNumber.toLowerCase().includes(searchTerm)
      );
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (column && direction) {
        receipts = [...receipts].sort((a,b) => {
            const aVal = a[column];
            const bVal = b[column];
            let comp = 0;
            if (column === 'date') {
              comp = new Date(aVal).getTime() - new Date(bVal).getTime();
            } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                comp = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comp = aVal - bVal;
            }
            return direction === 'asc' ? comp : -comp;
        });
    }

    return receipts;
  });

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }
}