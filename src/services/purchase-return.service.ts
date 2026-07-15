import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PurchaseReturnInvoice } from '../models/purchase-return-invoice.model';
import { PurchaseReturn, PurchaseReturnJournalEntry } from '../models/sales-return.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchaseReturnService {
  private http = inject(HttpClient);
  private legacyApiUrl = environment.origin + 'api/PurchaseReturns';
  private apiUrl = '/api/purchase-returns';

  constructor() {}

  // Legacy methods for PurchaseReturnInvoice
  getReturnInvoices(): Observable<PurchaseReturnInvoice[]> {
    return this.http.get<PurchaseReturnInvoice[]>(this.legacyApiUrl);
  }

  getReturnInvoiceById(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.get<PurchaseReturnInvoice>(`${this.legacyApiUrl}/${id}`);
  }

  addReturnInvoice(invoice: Omit<PurchaseReturnInvoice, 'id'>): Observable<PurchaseReturnInvoice> {
    console.log('Adding return invoice:', invoice);
    return this.http.post<PurchaseReturnInvoice>(this.legacyApiUrl+"/Create", invoice);
  }

  archiveReturnInvoice(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.patch<PurchaseReturnInvoice>(`${this.legacyApiUrl}/${id}`, { isArchived: true });
  }

  unarchiveReturnInvoice(id: number): Observable<PurchaseReturnInvoice> {
    return this.http.patch<PurchaseReturnInvoice>(`${this.legacyApiUrl}/${id}`, { isArchived: false });
  }

  // New methods for PurchaseReturn with accounting
  /**
   * Create a new purchase return (draft status)
   */
  createPurchaseReturn(purchaseReturn: PurchaseReturn): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(this.apiUrl, purchaseReturn);
  }

  /**
   * Get purchase return by ID
   */
  getPurchaseReturnById(id: number): Observable<PurchaseReturn> {
    return this.http.get<PurchaseReturn>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all purchase returns
   */
  getAllPurchaseReturns(): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(this.apiUrl);
  }

  /**
   * Get pending purchase returns
   */
  getPendingReturns(): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Get purchase returns by status
   */
  getReturnsByStatus(status: string): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Approve a purchase return and create journal entries
   */
  approvePurchaseReturn(id: number, entries: PurchaseReturnJournalEntry[]): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(
      `${this.apiUrl}/${id}/approve`,
      { entries }
    );
  }

  /**
   * Reject a purchase return
   */
  rejectPurchaseReturn(id: number, rejectionReason: string): Observable<PurchaseReturn> {
    return this.http.post<PurchaseReturn>(
      `${this.apiUrl}/${id}/reject`,
      { rejectionReason }
    );
  }

  /**
   * Update purchase return
   */
  updatePurchaseReturn(id: number, purchaseReturn: Partial<PurchaseReturn>): Observable<PurchaseReturn> {
    return this.http.put<PurchaseReturn>(`${this.apiUrl}/${id}`, purchaseReturn);
  }

  /**
   * Delete purchase return
   */
  deletePurchaseReturn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get purchase returns by invoice
   */
  getReturnsByInvoice(invoiceId: number): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(`${this.apiUrl}/invoice/${invoiceId}`);
  }

  /**
   * Get purchase returns by car VIN
   */
  getReturnsByVin(vin: string): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(`${this.apiUrl}/vin/${vin}`);
  }

  /**
   * Get purchase returns by supplier
   */
  getReturnsBySupplier(supplierId: number): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(`${this.apiUrl}/supplier/${supplierId}`);
  }

  /**
   * Generate next return number
   */
  generateReturnNumber(): Observable<{ returnNo: string }> {
    return this.http.get<{ returnNo: string }>(`${this.apiUrl}/generate-number`);
  }

  /**
   * Get return statistics
   */
  getReturnStatistics(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }

  /**
   * Get supplier statistics
   */
  getSupplierReturnStats(supplierId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/supplier/${supplierId}/stats`);
  }

  /**
   * Export purchase returns as PDF
   */
  exportReturnsPDF(filters?: any): Observable<Blob> {
    return this.http.post<Blob>(`${this.apiUrl}/export/pdf`, filters, {
      responseType: 'blob' as any
    });
  }

  /**
   * Export purchase returns as Excel
   */
  exportReturnsExcel(filters?: any): Observable<Blob> {
    return this.http.post<Blob>(`${this.apiUrl}/export/excel`, filters, {
      responseType: 'blob' as any
    });
  }
}
