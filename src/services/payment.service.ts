import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Payment } from '../models/payment.model';
import { CarPaymentVoucher } from '../models/car-payment-voucher.model';
import { Observable, tap, forkJoin, of } from 'rxjs';
import { environment } from '../environments/environment';
import { map, switchMap } from 'rxjs/operators';
import 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { LoadOptions } from 'devextreme/data';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);

  // رابط API الخاص بالدفع
  private apiUrl = environment.origin + 'api/Payments';
  private suppliersApiUrl = environment.origin + 'api/Suppliers';
  private accountsApiUrl = environment.origin + 'api/Accounts';

  payments$ = this.getPayments();

  constructor() {}

  // إضافة دفع عبر API باستخدام نموذج Voucher الموحد
  addPayment(payment: Partial<Payment>): Observable<Payment> {
    const payload: any = { ...payment };
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
    return this.http.post<Payment>(this.apiUrl+'/Create', payload);
  }
 // تحديث دفع عبر API باستخدام نموذج Voucher الموحد
  updatePayment(payment: Partial<Payment>, paymentId: number): Observable<Payment> {
    return this.http.put<Payment>(`${this.apiUrl}/${paymentId}`, payment);
  }
  // استدعاء كل المدفوعات
  getPayments(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.apiUrl+`/GetAll`);
  }

  // استدعاء كل المدفوعات مع خيارات التحميل
  getPaymentsWithLoadOptions(loadOptions: any): Observable<any> {
    return this.http.get(this.apiUrl+`/GetAll`, loadOptions);
  }

  // استدعاء دفعة واحدة بالمعرف
  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/GetById/${id}`);
  }

  // حذف دفعة
  deletePayment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  // Save Car Payment Voucher
  saveCarPaymentVoucher(voucher: CarPaymentVoucher): Observable<CarPaymentVoucher> {
    return this.http.post<CarPaymentVoucher>(`${this.apiUrl}/CreateCarPayment`, voucher);
  }
}
