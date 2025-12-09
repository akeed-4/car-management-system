import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Expense } from '../types/expense.model';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private apiUrl = 'http://localhost:5294/api/expenses';

  private expenses = signal<Expense[]>([]);
  public expenses$ = this.expenses.asReadonly();

  constructor(private http: HttpClient) {
    this.loadExpenses();
  }

  /** Load all expenses */
  loadExpenses() {
    this.http.get<Expense[]>(this.apiUrl)
      .pipe(tap(data => this.expenses.set(data)))
      .subscribe();
  }

  /** Get single expense by ID */
  getExpenseById(id: number): Expense | undefined {
    return this.expenses().find(e => e.id === id);
  }

  /** Add new expense */
  addExpense(expense: Omit<Expense, 'id' | 'isArchived'>) {
    const payload = { ...expense, isArchived: false };

    this.http.post<Expense>(this.apiUrl, payload)
      .pipe(
        tap(newExpense => {
          this.expenses.update(list => [...list, newExpense]);
        })
      )
      .subscribe();
  }

  /** Update existing expense */
  updateExpense(expense: Expense) {
    const url = `${this.apiUrl}/${expense.id}`;
    this.http.put<Expense>(url, expense)
      .pipe(
        tap(updated => {
          this.expenses.update(list =>
            list.map(e => (e.id === updated.id ? updated : e))
          );
        })
      )
      .subscribe();
  }

  /** Delete expense */
  deleteExpense(id: number) {
    const url = `${this.apiUrl}/${id}`;
    this.http.delete(url)
      .pipe(
        tap(() => {
          this.expenses.update(list => list.filter(e => e.id !== id));
        })
      )
      .subscribe();
  }

  /** Archive expense */
  archiveExpense(id: number) {
    const url = `${this.apiUrl}/${id}/archive`;
    this.http.put(url, null)
      .pipe(
        tap(() => {
          this.expenses.update(list =>
            list.map(e => (e.id === id ? { ...e, isArchived: true } : e))
          );
        })
      )
      .subscribe();
  }

  /** Unarchive expense */
  unarchiveExpense(id: number) {
    const url = `${this.apiUrl}/${id}/unarchive`;
    this.http.put(url, null)
      .pipe(
        tap(() => {
          this.expenses.update(list =>
            list.map(e => (e.id === id ? { ...e, isArchived: false } : e))
          );
        })
      )
      .subscribe();
  }
}
