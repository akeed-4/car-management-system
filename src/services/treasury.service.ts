import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TreasuryAccount } from '../types/treasury-account.model';

@Injectable({
  providedIn: 'root',
})
export class TreasuryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/treasury-accounts'; // رابط الـ API
  accounts$: any;

  constructor() {}

  // جلب جميع الحسابات
  getAccounts(): Observable<TreasuryAccount[]> {
    return this.http.get<TreasuryAccount[]>(this.apiUrl);
  }

  // جلب حساب واحد حسب ID
  getAccountById(id: number): Observable<TreasuryAccount> {
    return this.http.get<TreasuryAccount>(`${this.apiUrl}/${id}`);
  }

  // إضافة حساب جديد
  addAccount(account: Omit<TreasuryAccount, 'id'>): Observable<TreasuryAccount> {
    return this.http.post<TreasuryAccount>(this.apiUrl, account);
  }

  // تحديث حساب موجود
  updateAccount(account: TreasuryAccount): Observable<TreasuryAccount> {
    return this.http.put<TreasuryAccount>(`${this.apiUrl}/${account.id}`, account);
  }

  // حذف حساب (اختياري)
  deleteAccount(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
