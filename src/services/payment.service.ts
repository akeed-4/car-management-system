import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PaymentVoucher } from '../types/payment-voucher.model';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);

  // رابط API الخاص بالدفع
  private apiUrl = environment.origin + 'api/Payments';

  payments$ = this.getPayments();

  constructor() {}

  // إضافة دفع عبر API باستخدام نموذج Voucher الموحد
  addPayment(payment: Partial<PaymentVoucher>): Observable<PaymentVoucher> {
    return this.http.post<PaymentVoucher>(this.apiUrl+'/Create', payment);
  }
 // إضافة دفع عبر API باستخدام نموذج Voucher الموحد
  updatePayment(payment: Partial<PaymentVoucher>,paymentId: number): Observable<PaymentVoucher> {
    return this.http.post<PaymentVoucher>(this.apiUrl+'/Update', payment);
  }
  // استدعاء كل المدفوعات
  getPayments(): Observable<PaymentVoucher[]> {
    return this.http.get<PaymentVoucher[]>(this.apiUrl+`/GetAll`);
  }

  // استدعاء دفعة واحدة بالمعرف
  getPaymentById(id: number): Observable<PaymentVoucher> {
    return this.http.get<PaymentVoucher>(`${this.apiUrl}/GetById/${id}`);
  }

  // حذف دفعة
  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}
