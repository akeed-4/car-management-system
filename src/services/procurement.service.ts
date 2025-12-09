import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PurchaseInvoice } from '../types/purchase-invoice.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProcurementService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/purchase-invoices';

  constructor() {}

  // استدعاء كل الفواتير
  getInvoices(): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(this.apiUrl);
  }

  // استدعاء فاتورة معينة حسب ID
  getInvoiceById(id: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/${id}`);
  }

  // إضافة فاتورة جديدة
  addInvoice(invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue'>): Observable<PurchaseInvoice> {
    const payload = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      isArchived: false,
    };
    return this.http.post<PurchaseInvoice>(this.apiUrl, payload);
  }

  // تطبيق الدفع على فاتورة
  applyPayment(invoiceId: number, paymentAmount: number): Observable<PurchaseInvoice> {
    return this.http.patch<PurchaseInvoice>(`${this.apiUrl}/${invoiceId}/payment`, { paymentAmount });
  }

  // أرشفة فاتورة
  archiveInvoice(id: number): Observable<PurchaseInvoice> {
    return this.http.patch<PurchaseInvoice>(`${this.apiUrl}/${id}`, { isArchived: true });
  }

  // إلغاء الأرشفة
  unarchiveInvoice(id: number): Observable<PurchaseInvoice> {
    return this.http.patch<PurchaseInvoice>(`${this.apiUrl}/${id}`, { isArchived: false });
  }

  // استدعاء الفواتير الغير مدفوعة لمورد معين
  getOutstandingInvoicesBySupplierId(supplierId: number): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}?supplierId=${supplierId}&status=Unpaid`);
  }
}
