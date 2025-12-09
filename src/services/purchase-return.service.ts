import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PurchaseReturnInvoice } from '../types/purchase-return-invoice.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PurchaseReturnService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/purchase-return-invoices';

  constructor() {}

  // استدعاء كل فواتير المرتجعات
  getReturnInvoices(): Observable<PurchaseReturnInvoice[]> {
    return this.http.get<PurchaseReturnInvoice[]>(this.apiUrl);
  }

  // استدعاء فاتورة مرتجع معينة حسب ID
  getReturnInvoiceById(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.get<PurchaseReturnInvoice>(`${this.apiUrl}/${id}`);
  }

  // إضافة فاتورة مرتجع جديدة
  addReturnInvoice(invoice: Omit<PurchaseReturnInvoice, 'id'>): Observable<PurchaseReturnInvoice> {
    return this.http.post<PurchaseReturnInvoice>(this.apiUrl, invoice);
  }

  // أرشفة فاتورة المرتجع
  archiveReturnInvoice(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.patch<PurchaseReturnInvoice>(`${this.apiUrl}/${id}`, { isArchived: true });
  }

  // إلغاء أرشفة فاتورة المرتجع
  unarchiveReturnInvoice(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.patch<PurchaseReturnInvoice>(`${this.apiUrl}/${id}`, { isArchived: false });
  }
}
