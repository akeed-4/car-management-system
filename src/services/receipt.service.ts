import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReceiptVoucher } from '../types/receipt-voucher.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + '/ Receipts'; // ضع رابط API الحقيقي هنا

  receipts$ = this.getReceipts();

  constructor() {}

  // جلب كل الإيصالات
  getReceipts(): Observable<ReceiptVoucher[]> {
    return this.http.get<ReceiptVoucher[]>(this.apiUrl+'/GetAll');
  }

  // جلب إيصال محدد حسب ID
  getReceiptById(id: number): Observable<ReceiptVoucher> {
    return this.http.get<ReceiptVoucher>(`${this.apiUrl+'/GetById'}/${id}`);
  }

  // إضافة إيصال جديد
  addReceipt(receipt: Partial<ReceiptVoucher>): Observable<ReceiptVoucher> {
    return this.http.post<ReceiptVoucher>(this.apiUrl+'/Create', receipt);
  }

  // تحديث إيصال
  updateReceipt(receipt: Partial<ReceiptVoucher>, receiptId: number): Observable<ReceiptVoucher> {
    return this.http.put<ReceiptVoucher>(`${this.apiUrl+'/Update'}/${receiptId}`, receipt);
  }

  // أرشفة إيصال
  archiveReceipt(id: number): Observable<ReceiptVoucher> {
    return this.http.patch<ReceiptVoucher>(`${this.apiUrl+'/Archive'}/${id}`, { isArchived: true });
  }

  // إلغاء أرشفة إيصال
  unarchiveReceipt(id: number): Observable<ReceiptVoucher> {
    return this.http.patch<ReceiptVoucher>(`${this.apiUrl}/${id}`, { isArchived: false });
  }
}
