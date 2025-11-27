import { Injectable, signal } from '@angular/core';
import { Expense } from '../types/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private nextId = signal(3);
  private expenses = signal<Expense[]>([
    {
      id: 1,
      date: '2024-05-01',
      description: 'إيجار معرض شهر مايو',
      category: 'Rent',
      amount: 15000,
      notes: 'دفعة شهرية',
    },
    {
      id: 2,
      date: '2024-05-10',
      description: 'فاتورة كهرباء',
      category: 'Utilities',
      amount: 1200,
      notes: 'الربع الثاني',
    },
  ]);

  public expenses$ = this.expenses.asReadonly();

  getExpenseById(id: number): Expense | undefined {
    return this.expenses().find(e => e.id === id);
  }

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: this.nextId(),
    };
    this.expenses.update(expenses => [...expenses, newExpense]);
    this.nextId.update(id => id + 1);
  }

  updateExpense(updatedExpense: Expense) {
    this.expenses.update(expenses =>
      expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e))
    );
  }

  deleteExpense(id: number) {
    this.expenses.update(expenses => expenses.filter(e => e.id !== id));
  }
}