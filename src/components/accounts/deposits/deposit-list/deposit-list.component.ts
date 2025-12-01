import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepositService } from '../../../../services/deposit.service';
import { DepositVoucher } from '../../../../types/deposit-voucher.model';

type SortColumn = keyof DepositVoucher | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-deposit-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './deposit-list.component.html',
  styleUrl: './deposit-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositListComponent {
  // Fix: Explicitly typed depositService to resolve 'unknown' type inference.
  private depositService: DepositService = inject(DepositService);
  
  deposits = this.depositService.deposits$;
  filter = signal('');
  sortColumn = signal<SortColumn>('date');
  sortDirection = signal<SortDirection>('desc');

  filteredAndSortedDeposits = computed(() => {
    let deposits = this.deposits();
    const searchTerm = this.filter().toLowerCase();
    
    if (searchTerm) {
      deposits = deposits.filter(d => 
        d.voucherNumber.toLowerCase().includes(searchTerm) ||
        d.customerName.toLowerCase().includes(searchTerm) ||
        d.carDescription.toLowerCase().includes(searchTerm)
      );
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (column && direction) {
        deposits = [...deposits].sort((a,b) => {
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

    return deposits;
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