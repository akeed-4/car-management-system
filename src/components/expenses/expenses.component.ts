import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../types/expense.model';
import { ModalComponent } from '../shared/modal/modal.component';

type SortColumn = keyof Expense | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, ModalComponent],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent {
  private expenseService = inject(ExpenseService);
  private router = inject(Router);

  expenses = this.expenseService.expenses$;
  filter = signal('');
  sortColumn = signal<SortColumn>('date');
  sortDirection = signal<SortDirection>('desc');
  showArchived = signal(false);

  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedExpenses = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const showArchived = this.showArchived();

    let expenses = this.expenses().filter(exp => !!exp.isArchived === showArchived);

    if (searchTerm) {
      expenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm) ||
        e.category.toLowerCase().includes(searchTerm) ||
        e.amount.toString().includes(searchTerm)
      );
    }

    if (column && direction) {
      expenses = [...expenses].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];
        let comparison = 0;
        
        if (aValue === undefined || bValue === undefined) {
          return 0;
        }

        if (column === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }
    return expenses;
  });

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  editExpense(id: number) {
    this.router.navigate(['/expenses/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    if (this.itemToDeleteId()) {
      this.expenseService.deleteExpense(this.itemToDeleteId()!);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  archiveExpense(id: number) {
    this.expenseService.archiveExpense(id);
  }

  unarchiveExpense(id: number) {
    this.expenseService.unarchiveExpense(id);
  }
}