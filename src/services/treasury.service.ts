import { Injectable, signal } from '@angular/core';
import { TreasuryAccount } from '../types/treasury-account.model';

@Injectable({
  providedIn: 'root',
})
export class TreasuryService {
  private accounts = signal<TreasuryAccount[]>([
    { id: 1, name: 'خزينة الكاش الرئيسية' },
    { id: 2, name: 'حساب بنك الراجحي' },
  ]);

  public accounts$ = this.accounts.asReadonly();

  getAccountById(id: number): TreasuryAccount | undefined {
    return this.accounts().find(a => a.id === id);
  }
}
