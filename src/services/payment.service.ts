import { Injectable, signal } from '@angular/core';
import { Payment } from '../types/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private nextId = signal(3);
  private payments = signal<Payment[]>([
    {
      id: 1,
      date: '2024-05-10',
      paymentNumber: 'PAY-001',
      supplierName: 'شركة السيارات الحديثة',
      amount: 200000,
      paymentMethod: 'BankTransfer',
      description: 'دفعة لشراء سيارات جديدة',
      notes: 'تحويل بنكي',
    },
    {
      id: 2,
      date: '2024-05-18',
      paymentNumber: 'PAY-002',
      supplierName: 'مورد قطع الغيار',
      amount: 15000,
      paymentMethod: 'Cash',
      description: 'شراء قطع غيار',
      notes: 'دفع نقدي',
    },
  ]);

  public payments$ = this.payments.asReadonly();

  getPaymentById(id: number): Payment | undefined {
    return this.payments().find(p => p.id === id);
  }

  addPayment(payment: Omit<Payment, 'id'>) {
    const newPayment: Payment = {
      ...payment,
      id: this.nextId(),
    };
    this.payments.update(payments => [...payments, newPayment]);
    this.nextId.update(id => id + 1);
  }

  updatePayment(updatedPayment: Payment) {
    this.payments.update(payments =>
      payments.map(p => (p.id === updatedPayment.id ? updatedPayment : p))
    );
  }

  deletePayment(id: number) {
    this.payments.update(payments => payments.filter(p => p.id !== id));
  }

  generatePaymentNumber(): string {
    const count = this.payments().length + 1;
    return `PAY-${String(count).padStart(3, '0')}`;
  }
}
