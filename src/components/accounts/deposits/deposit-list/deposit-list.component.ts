import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepositService } from '../../../../services/deposit.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DxDataGridModule, DxButtonModule, DxTemplateModule, DxTemplateHost } from 'devextreme-angular';
import { AdvancePaymentVoucher } from '@/src/models/advancePaymentVoucher.model';

type SortColumn = keyof AdvancePaymentVoucher | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-deposit-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule
  ],
  providers: [DxTemplateHost],
  templateUrl: './deposit-list.component.html',
  styleUrl: './deposit-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepositListComponent {
  // Fix: Explicitly typed depositService to resolve 'unknown' type inference.
  private depositService: DepositService = inject(DepositService);
  private router = inject(Router);

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
              const aDate = (typeof aVal === 'string' || typeof aVal === 'number' || aVal instanceof Date) ? new Date(aVal).getTime() : 0;
              const bDate = (typeof bVal === 'string' || typeof bVal === 'number' || bVal instanceof Date) ? new Date(bVal).getTime() : 0;
              comp = aDate - bDate;
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
  constructor() {
    console.log('DepositListComponent initialized');
  }

  Edite = (e: any) => {
    const id = e?.row?.data?.id ?? e?.data?.id ?? e?.data?.voucherNumber;
    if (!id) {
      console.error('Deposit id not found on event', e);
      return;
    }
    this.router.navigate(['/accounts/deposits/edit', id]);
  }

  deleteDeposit = (e: any) => {
    const id = e?.row?.data?.id ?? e?.data?.id ?? e?.data?.voucherNumber;
    if (!id) {
      console.error('Deposit id not found on event', e);
      return;
    }
    if (confirm('Are you sure you want to delete this deposit?')) {
      this.depositService.deleteDeposit(id).subscribe({
        next: () => console.log('Deposit deleted successfully'),
        error: err => console.error('Error deleting deposit:', err)
      });
    }
  }
}