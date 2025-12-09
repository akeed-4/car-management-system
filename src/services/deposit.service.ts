import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { DepositVoucher } from '../types/deposit-voucher.model';

@Injectable({
  providedIn: 'root',
})
export class DepositService {
  private apiUrl = 'http://localhost:5294/api/deposits';

  private deposits = signal<DepositVoucher[]>([]);
  public deposits$ = this.deposits.asReadonly();

  constructor(private http: HttpClient) {
    this.loadDeposits();
  }

  /** Load all deposit vouchers */
  loadDeposits() {
    this.http.get<DepositVoucher[]>(this.apiUrl)
      .pipe(tap(data => this.deposits.set(data)))
      .subscribe();
  }

  /** Get single deposit by ID from cache */
  getDepositById(id: number): DepositVoucher | undefined {
    return this.deposits().find(d => d.id === id);
  }

  /** Add new deposit voucher */
  addDeposit(deposit: Omit<DepositVoucher, 'id'>) {
    this.http.post<DepositVoucher>(this.apiUrl, deposit)
      .pipe(
        tap(newDeposit => {
          this.deposits.update(list => [...list, newDeposit]);
        })
      )
      .subscribe();
  }

  /** Update existing deposit */
  updateDeposit(deposit: DepositVoucher) {
    const url = `${this.apiUrl}/${deposit.id}`;

    this.http.put<DepositVoucher>(url, deposit)
      .pipe(
        tap(updated => {
          this.deposits.update(list =>
            list.map(d => (d.id === updated.id ? updated : d))
          );
        })
      )
      .subscribe();
  }

  /** Delete deposit voucher */
  deleteDeposit(id: number) {
    const url = `${this.apiUrl}/${id}`;

    this.http.delete(url)
      .pipe(
        tap(() => {
          this.deposits.update(list => list.filter(d => d.id !== id));
        })
      )
      .subscribe();
  }
}
