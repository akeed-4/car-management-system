import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReceiptVoucher } from '../types/receipt-voucher.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/receipt-vouchers'; // ضع رابط API الحقيقي هنا

  receipts$ = this.getReceipts();

  constructor() {}

  // جلب كل الإيصالات
  getReceipts(): Observable<ReceiptVoucher[]> {
    return this.http.get<ReceiptVoucher[]>(this.apiUrl);
  }

  // جلب إيصال محدد حسب ID
  getReceiptById(id: number): Observable<ReceiptVoucher> {
    return this.http.get<ReceiptVoucher>(`${this.apiUrl}/${id}`);
  }

  // إضافة إيصال جديد
  addReceipt(receipt: Omit<ReceiptVoucher, 'id'>): Observable<ReceiptVoucher> {
    return this.http.post<ReceiptVoucher>(this.apiUrl, receipt);
  }

  // أرشفة إيصال
  archiveReceipt(id: number): Observable<ReceiptVoucher> {
    return this.http.patch<ReceiptVoucher>(`${this.apiUrl}/${id}`, { isArchived: true });
  }

  // إلغاء أرشفة إيصال
  unarchiveReceipt(id: number): Observable<ReceiptVoucher> {
    return this.http.patch<ReceiptVoucher>(`${this.apiUrl}/${id}`, { isArchived: false });
  }
}
