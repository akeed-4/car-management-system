
import { Injectable, signal } from '@angular/core';
import { DepositVoucher } from '../types/deposit-voucher.model';

@Injectable({
  providedIn: 'root',
})
export class DepositService {
  private nextId = signal(1);
  private deposits = signal<DepositVoucher[]>([]);

  public deposits$ = this.deposits.asReadonly();

  getDepositById(id: number): DepositVoucher | undefined {
    return this.deposits().find(d => d.id === id);
  }

  addDeposit(deposit: Omit<DepositVoucher, 'id'>) {
    const newDeposit: DepositVoucher = {
      ...deposit,
      id: this.nextId(),
    };
    this.deposits.update(deposits => [...deposits, newDeposit]);
    this.nextId.update(id => id + 1);
  }

  // Not typically updated, but useful for consistency
  updateDeposit(updatedDeposit: DepositVoucher) {
    this.deposits.update(deposits =>
      deposits.map(d => (d.id === updatedDeposit.id ? updatedDeposit : d))
    );
  }

  deleteDeposit(id: number) {
    this.deposits.update(deposits => deposits.filter(d => d.id !== id));
  }
}
