import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchasesService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/PurchaseInvoices';

  constructor() {}

  /** GetById (unlike GetAll) returns the raw ApiResponse<T> envelope ({ success, message, data })
   * instead of a bare PurchaseInvoice -- there's no global unwrapping interceptor configured, so
   * without this the caller receives the envelope itself typed (incorrectly) as PurchaseInvoice.
   * That mismatch is the root cause of the edit-mode grid bug: PurchaseInvoiceComponent worked
   * around it ad hoc by reading `invoice.data.xxx` for header fields, but `invoice.data.items` was
   * the one field it also needed and every other consumer (PrintablePurchaseInvoiceComponent,
   * this file's own JSDoc/typing) assumes the bare shape. Unwrapping once here, at the source,
   * means every consumer can trust the declared `Observable<PurchaseInvoice>` type literally.
   * Passes bare responses through unchanged, so this is safe regardless of what the backend
   * actually returns (see SalesService.unwrap, which documents the same backend inconsistency). */
  private unwrap<T>(response: any): T {
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  }

  getInvoices(): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(this.apiUrl+'/GetAll');
  }

  getInvoiceById(id: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl+'/GetById'}/${id}`)
      .pipe(map(res => this.unwrap<PurchaseInvoice>(res)));
  }

  /** debitAccountId/creditAccountId are excluded entirely -- not just made optional. The backend
   * always derives both accounts server-side (Debit from the selected Store's inventory
   * accounting configuration, Credit from the Supplier's linked account) and never reads a
   * client-supplied value for either; CreatePurchaseInvoiceDto doesn't even declare these
   * properties -- see PurchaseInvoiceService.ResolveDebitAccountAsync/ResolveCreditAccountAsync
   * on the backend. */
  addInvoice(invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount' | 'debitAccountId' | 'creditAccountId'>): Observable<PurchaseInvoice> {
    // The backend derives amountPaid/amountDue/status itself from paymentType + initialPayment
    // (cash invoices are auto-marked fully paid; credit invoices net off initialPayment) - it
    // does not trust client-sent amountPaid/amountDue on create.
    const payload: any = {
      ...invoice,
      isArchived: false,
    };

    // Create returns the raw ApiResponse<T> envelope ({ success, message, data }), same as
    // GetById -- without unwrapping, callers reading `savedInvoice.id` (to switch into edit mode,
    // or to resolve the id for Save & Print) get undefined.
    return this.http.post<PurchaseInvoice>(this.apiUrl+'/Create', payload)
      .pipe(map(res => this.unwrap<PurchaseInvoice>(res)));
  }

  /** Same exclusion as addInvoice -- on Update the backend re-derives Credit only if SupplierId
   * actually changes (UpdatePurchaseInvoiceDto doesn't declare these fields at all); Debit is
   * immutable after creation since the Store an invoice posted stock into isn't editable via this
   * DTO. */
  updateInvoice(id: number, invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt' | 'supplier' | 'debitAccount' | 'creditAccount' | 'debitAccountId' | 'creditAccountId'>): Observable<PurchaseInvoice> {
    // Same as addInvoice: let the backend recompute amountPaid/amountDue/status from
    // paymentType + initialPayment rather than forcing them here.
    const payload: any = {
      ...invoice,
      isArchived: false,
    };

    return this.http.put<PurchaseInvoice>(`${this.apiUrl}/Update/${id}`, payload);
  }

  // تطبيق الدفع على فاتورة
  applyPayment(invoiceId: number, paymentAmount: number): Observable<PurchaseInvoice> {
    return this.http.patch<PurchaseInvoice>(`${this.apiUrl}/${invoiceId}/payment`, { paymentAmount });
  }

  // أرشفة فاتورة
  /** Phase cancellation lifecycle: reverses inventory + accounting for an unpaid purchase invoice. */
  cancelInvoice(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Cancel/${id}`, {});
  }

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
