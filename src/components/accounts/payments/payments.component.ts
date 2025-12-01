import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../services/payment.service';
import { PaymentVoucher } from '../../../types/payment-voucher.model';

type SortColumn = keyof PaymentVoucher | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentsComponent {
  private paymentService = inject(PaymentService);

  payments = this.paymentService.payments$;
  filter = signal('');
  sortColumn = signal<SortColumn>('date');
  sortDirection = signal<SortDirection>('desc');

  filteredAndSortedPayments = computed(() => {
    let payments = this.payments();
    const searchTerm = this.filter().toLowerCase();

    if (searchTerm) {
      payments = payments.filter(p =>
        p.voucherNumber.toLowerCase().includes(searchTerm) ||
        p.supplierName.toLowerCase().includes(searchTerm) ||
        p.purchaseInvoiceNumber.toLowerCase().includes(searchTerm)
      );
    }
    
    const column = this.sortColumn();
    const direction = this.sortDirection();

    if (column && direction) {
        payments = [...payments].sort((a,b) => {
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

    return payments;
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