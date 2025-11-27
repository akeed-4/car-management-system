import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../types/expense.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent {
  private expenseService = inject(ExpenseService);
  private router = inject(Router);

  expenses = this.expenseService.expenses$;

  totalExpenses = computed(() => {
    return this.expenses().reduce((sum, e) => sum + e.amount, 0);
  });

  navigateToNewExpense() {
    this.router.navigate(['/expenses/new']);
  }

  editExpense(id: number) {
    this.router.navigate(['/expenses/edit', id]);
  }

  deleteExpense(id: number) {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      this.expenseService.deleteExpense(id);
    }
  }

  getCategoryLabel(category: string): string {
    const categoryMap: Record<string, string> = {
      'Rent': 'إيجار',
      'Utilities': 'مرافق',
      'Salaries': 'رواتب',
      'Marketing': 'تسويق',
      'Maintenance': 'صيانة',
      'Other': 'أخرى'
    };
    return categoryMap[category] || category;
  }
}
