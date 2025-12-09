import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesReturnInvoice } from '../types/sales-return-invoice.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/sales-return-invoices'; // ضع رابط API الحقيقي هنا

  constructor() {}

  // جلب جميع فواتير المرتجعات
  getReturnInvoices(): Observable<SalesReturnInvoice[]> {
    return this.http.get<SalesReturnInvoice[]>(this.apiUrl);
  }

  // جلب فاتورة محددة حسب ID
  getReturnInvoiceById(id: number): Observable<SalesReturnInvoice> {
    return this.http.get<SalesReturnInvoice>(`${this.apiUrl}/${id}`);
  }

  // إضافة فاتورة مرتجع جديدة
  addReturnInvoice(invoice: Omit<SalesReturnInvoice, 'id'>): Observable<SalesReturnInvoice> {
    return this.http.post<SalesReturnInvoice>(this.apiUrl, invoice);
  }

  // تحديث فاتورة مرتجع موجودة
  updateReturnInvoice(invoice: SalesReturnInvoice): Observable<SalesReturnInvoice> {
    return this.http.put<SalesReturnInvoice>(`${this.apiUrl}/${invoice.id}`, invoice);
  }

  // حذف فاتورة مرتجع
  deleteReturnInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
