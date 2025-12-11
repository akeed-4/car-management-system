import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs';
import { TreasuryAccount } from '../types/treasury-account.model';

@Injectable({
  providedIn: 'root',
})
export class TreasuryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/treasury-accounts'; // رابط الـ API

  private accounts = signal<TreasuryAccount[]>([]);
  public accounts$ = this.accounts.asReadonly();

  constructor() {
    this.loadAccounts();
  }

  // جلب جميع الحسابات
  loadAccounts() {
    this.http.get<TreasuryAccount[]>(this.apiUrl)
      .pipe(
        tap(data => this.accounts.set(data))
      )
      .subscribe();
  }

  // جلب جميع الحسابات
  getAccounts(): Observable<TreasuryAccount[]> {
    return this.http.get<TreasuryAccount[]>(this.apiUrl);
  }

  // جلب حساب واحد حسب ID
  getAccountById(id: number): TreasuryAccount | undefined {
    return this.accounts().find(a => a.id === id);
  }

  // إضافة حساب جديد
  addAccount(account: Omit<TreasuryAccount, 'id'>) {
    this.http.post<TreasuryAccount>(this.apiUrl, account)
      .pipe(
        tap(newAccount => {
          this.accounts.update(a => [...a, newAccount]);
        })
      )
      .subscribe();
  }

  // تحديث حساب موجود
  updateAccount(account: TreasuryAccount) {
    this.http.put<TreasuryAccount>(`${this.apiUrl}/${account.id}`, account)
      .pipe(
        tap(updated => {
          this.accounts.update(a =>
            a.map(x => x.id === updated.id ? updated : x)
          );
        })
      )
      .subscribe();
  }

  // حذف حساب
  deleteAccount(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.accounts.update(a => a.filter(x => x.id !== id));
        })
      )
      .subscribe();
  }
}
