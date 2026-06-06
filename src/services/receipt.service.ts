import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReceiptVoucher } from '../models/receipt-voucher.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import 'devextreme/data/odata/store';
import { LoadOptions } from 'devextreme/data';

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/receipts'; // ضع رابط API الحقيقي هنا

  receipts$ = this.getReceipts();

  constructor() {}

  // جلب كل الإيصالات
  getReceipts(): Observable<ReceiptVoucher[]> {
    return this.http.get<ReceiptVoucher[]>(this.apiUrl+'/GetAll');
  }

  // جلب كل الإيصالات مع خيارات التحميل
  getReceiptsWithLoadOptions(loadOptions: any): Observable<any> {
    return this.http.post<any>(this.apiUrl+`/GetAll`, loadOptions);
  }

  // جلب إيصال محدد حسب ID
  getReceiptById(id: number): Observable<ReceiptVoucher> {
    return this.http.get<ReceiptVoucher>(`${this.apiUrl+'/GetById'}/${id}`);
  }

  // إضافة إيصال جديد
  addReceipt(receipt: Partial<ReceiptVoucher>): Observable<ReceiptVoucher> {
    // Ensure paymentMethod is a numeric code when server expects an integer
    const payload: any = { ...receipt };
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

    return this.http.post<ReceiptVoucher>(this.apiUrl+'/Create', payload);
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

  // حذف إيصال
  deleteReceipt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}
