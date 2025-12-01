

import { Injectable, signal } from '@angular/core';
import { Expense } from '../types/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private nextId = signal(4);
  private expenses = signal<Expense[]>([
    {
      id: 1,
      date: '2024-05-01',
      description: 'إيجار معرض شهر مايو',
      category: 'Rent',
      amount: 15000,
      notes: 'دفعة شهرية',
      accountId: 2,
      accountName: 'حساب بنك الراجحي',
      isArchived: false,
    },
    {
      id: 2,
      date: '2024-05-10',
      description: 'فاتورة كهرباء',
      category: 'Utilities',
      amount: 1200,
      notes: 'الربع الثاني',
      accountId: 1,
      accountName: 'خزينة الكاش الرئيسية',
      isArchived: false,
    },
    {
      id: 3,
      date: '2024-04-05',
      description: 'تغيير زيت وفلتر',
      category: 'Maintenance',
      amount: 450,
      accountId: 1,
      accountName: 'خزينة الكاش الرئيسية',
      carId: 1,
      carDescription: 'Toyota Camry (2023)',
      isArchived: false,
    }
  ]);

  public expenses$ = this.expenses.asReadonly();

  getExpenseById(id: number): Expense | undefined {
    return this.expenses().find(e => e.id === id);
  }

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: this.nextId(),
      isArchived: false,
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
  
  archiveExpense(id: number) {
    this.expenses.update(expenses =>
      expenses.map(exp => (exp.id === id ? { ...exp, isArchived: true } : exp))
    );
  }

  unarchiveExpense(id: number) {
    this.expenses.update(expenses =>
      expenses.map(exp => (exp.id === id ? { ...exp, isArchived: false } : exp))
    );
  }
}
    