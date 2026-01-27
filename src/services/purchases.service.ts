import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchasesService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/PurchaseInvoices';

  constructor() {}

  getInvoices(): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(this.apiUrl+'/GetAll');
  }

  getInvoiceById(id: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/${id}`);
  }

  addInvoice(invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'>): Observable<PurchaseInvoice> {
    const payload = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      isArchived: false,
    };
    return this.http.post<PurchaseInvoice>(this.apiUrl+'/Create', payload);
  }

  updateInvoice(id: number, invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'>): Observable<PurchaseInvoice> {
    const payload = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      isArchived: false,
    };
    return this.http.put<PurchaseInvoice>(`${this.apiUrl}/Update/${id}`, payload);
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

  // حذف فاتورة
  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl+'/Delete'}/${id}`);
  }

  // استدعاء الفواتير الغير مدفوعة لمورد معين
  getOutstandingInvoicesBySupplierId(supplierId: number): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/GetOutstandingBySupplierId/${supplierId}`);
  }
}
