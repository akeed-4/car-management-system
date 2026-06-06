import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
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
  addDeposit(deposit: Omit<DepositVoucher, 'id'>): Observable<{ deposit: DepositVoucher; source: 'backend' | 'fallback' }> {
    // Ensure paymentMethod is a numeric code when server expects an integer
    const payload: any = { ...deposit };
    if (typeof payload.paymentMethod === 'string') {
      const m = String(payload.paymentMethod).toUpperCase();
      const map: Record<string, number> = {
        CASH: 1,
        BANK_TRANSFER: 2,
        BANK: 2,
        CARD: 3,
        CHECK: 4,
        CHEQUE: 4,
        'BANKTRANSFER': 2
      };
      payload.paymentMethod = map[m] ?? payload.paymentMethod;
    }

    return this.http.post<DepositVoucher>(`${this.apiUrl}/Create`, payload).pipe(
      map(res => ({ deposit: res, source: 'backend' as const })),
      catchError(err => {
        console.error('API Error, saving to local fallback:', err);
        // Returns a simulated success to trigger the offline notification in UI
        return of({ 
          deposit: { ...payload, id: Date.now() } as DepositVoucher, 
          source: 'fallback' as const 
        });
      })
    );
  }

  /** Update existing deposit */
  updateDeposit(deposit: DepositVoucher) {
    return this.http.put<DepositVoucher>(`${this.apiUrl}/Update/${deposit.id}`, deposit)
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
