import { Injectable, signal } from '@angular/core';
import { PaymentVoucher } from '../types/payment-voucher.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private nextId = signal(1);
  private payments = signal<PaymentVoucher[]>([]);

  public payments$ = this.payments.asReadonly();

  addPayment(payment: Omit<PaymentVoucher, 'id'>) {
    const newPayment: PaymentVoucher = {
      ...payment,
      id: this.nextId(),
    };
    this.payments.update(payments => [...payments, newPayment]);
    this.nextId.update(id => id + 1);
  }
}