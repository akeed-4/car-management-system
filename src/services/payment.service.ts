import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaymentVoucher } from '../types/payment-voucher.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);

  // رابط API الخاص بالدفع
  private apiUrl = 'https://api.example.com/payments';

  payments$ = this.getPayments();

  constructor() {}

  // إضافة دفع عبر API باستخدام نموذج Voucher الموحد
  addPayment(payment: Partial<PaymentVoucher>): Observable<PaymentVoucher> {
    return this.http.post<PaymentVoucher>(this.apiUrl, payment);
  }

  // استدعاء كل المدفوعات
  getPayments(): Observable<PaymentVoucher[]> {
    return this.http.get<PaymentVoucher[]>(this.apiUrl);
  }
}
