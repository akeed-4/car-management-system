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
    const payload: any = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      isArchived: false,
    };

    if (typeof payload.paymentMethod === 'string') {
      const m = String(payload.paymentMethod).toUpperCase();
      const map: Record<string, number> = {
        CASH: 1,
        BANK_TRANSFER: 2,
        BANK: 2,
        CARD: 3,
        CHECK: 4,
        CHEQUE: 4,
        'FINANCE': 5
      };
      payload.paymentMethod = map[m] ?? payload.paymentMethod;
    }

    return this.http.post<PurchaseInvoice>(this.apiUrl+'/Create', payload);
  }

  updateInvoice(id: number, invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount'>): Observable<PurchaseInvoice> {
    const payload: any = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      isArchived: false,
    };

    if (typeof payload.paymentMethod === 'string') {
      const m = String(payload.paymentMethod).toUpperCase();
      const map: Record<string, number> = {
        CASH: 1,
        BANK_TRANSFER: 2,
        BANK: 2,
        CARD: 3,
        CHECK: 4,
        CHEQUE: 4,
        'FINANCE': 5
      };
      payload.paymentMethod = map[m] ?? payload.paymentMethod;
    }

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
