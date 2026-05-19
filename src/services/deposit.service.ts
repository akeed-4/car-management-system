import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { DepositVoucher } from '../models/deposit-voucher.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DepositService {
  private apiUrl = `${environment.origin}api/Deposits`;

  private deposits = signal<DepositVoucher[]>([]);
  public deposits$ = this.deposits.asReadonly();

  constructor(private http: HttpClient) {
    this.loadDeposits();
  }

  /** Load all deposit vouchers */
  loadDeposits() {
    this.http.get<DepositVoucher[]>(`${this.apiUrl}/GetAll`)
      .pipe(tap(data => this.deposits.set(data)))
      .subscribe();
  }

  /** Get single deposit by ID from cache */
  getDepositById(id: number): DepositVoucher | undefined {
    return this.deposits().find(d => d.id === id);
  }

  /** Add new deposit voucher */
  addDeposit(deposit: Omit<DepositVoucher, 'id'>) {
    return this.http.post<DepositVoucher>(`${this.apiUrl}/Create`, deposit).pipe(
      tap(newDeposit => {
        this.deposits.update(list => [...list, newDeposit]);
      })
    );
  }

  /** Update existing deposit */
  updateDeposit(deposit: DepositVoucher) {
    const url = `${this.apiUrl}/Update/${deposit.id}`;

    return this.http.put<DepositVoucher>(url, deposit).pipe(
      tap(updated => {
        this.deposits.update(list =>
          list.map(d => (d.id === updated.id ? updated : d))
        );
      })
    );
  }

  /** Delete deposit voucher */
  deleteDeposit(id: number) {
    const url = `${this.apiUrl}/Delete/${id}`;

    return this.http.delete<void>(url).pipe(
      tap(() => {
        this.deposits.update(list => list.filter(d => d.id !== id));
      })
    );
  }

  /** Get deposits by vehicle ID */
  getDepositsByVehicle(vehicleId: number) {
    return this.http.get<DepositVoucher[]>(`${this.apiUrl}/GetByVehicle/${vehicleId}`);
  }

  /** Mark deposit as invoiced */
  markDepositAsInvoiced(depositId: number) {
    return this.http.post<void>(`${this.apiUrl}/MarkAsInvoiced/${depositId}`, {});
  }
}
