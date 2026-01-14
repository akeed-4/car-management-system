import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesReturnInvoice } from '../types/sales-return-invoice.model';
import { SalesReturn, JournalEntry } from '../types/sales-return.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/SalesReturns';
  private legacyApiUrl = 'https://api.example.com/sales-return-invoices';

  constructor() {}

  // Legacy methods for SalesReturnInvoice
  getReturnInvoices(): Observable<SalesReturnInvoice[]> {
    return this.http.get<SalesReturnInvoice[]>(this.apiUrl+'/GetAll');
  }

  getReturnInvoiceById(id: number): Observable<SalesReturnInvoice> {
    return this.http.get<SalesReturnInvoice>(`${this.apiUrl+'/GetById'}/${id}`);
  }

  addReturnInvoice(invoice: Omit<SalesReturnInvoice, 'id'>): Observable<SalesReturnInvoice> {
    return this.http.post<SalesReturnInvoice>(this.legacyApiUrl, invoice);
  }

  updateReturnInvoice(invoice: SalesReturnInvoice): Observable<SalesReturnInvoice> {
    return this.http.put<SalesReturnInvoice>(`${this.legacyApiUrl}/${invoice.id}`, invoice);
  }

  deleteReturnInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.legacyApiUrl}/${id}`);
  }

  // New methods for SalesReturn with accounting
  /**
   * Create a new sales return (draft status)
   */
  createSalesReturn(salesReturn: SalesReturn): Observable<SalesReturn> {
    console.log('Creating sales return', salesReturn);
    return this.http.post<SalesReturn>(this.apiUrl + '/Create', salesReturn);
  }

  /**
   * Get sales return by ID
   */
  getSalesReturnById(id: number): Observable<SalesReturn> {
    return this.http.get<SalesReturn>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all sales returns
   */
  getAllSalesReturns(): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(this.apiUrl);
  }

  /**
   * Get pending sales returns (DRAFT or PENDING_APPROVAL)
   */
  getPendingReturns(): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(`${this.apiUrl}/pending`);
  }

  /**
   * Get sales returns by status
   */
  getReturnsByStatus(status: string): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(`${this.apiUrl}/status/${status}`);
  }

  /**
   * Approve a sales return and create journal entries
   */
  approveSalesReturn(id: number, entries: JournalEntry[]): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(
      `${this.apiUrl}/${id}/approve`,
      { entries }
    );
  }

  /**
   * Reject a sales return
   */
  rejectSalesReturn(id: number, rejectionReason: string): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(
      `${this.apiUrl}/${id}/reject`,
      { rejectionReason }
    );
  }

  /**
   * Update sales return
   */
  updateSalesReturn(id: number, salesReturn: Partial<SalesReturn>): Observable<SalesReturn> {
    return this.http.put<SalesReturn>(`${this.apiUrl}/${id}`, salesReturn);
  }

  /**
   * Delete sales return
   */
  deleteSalesReturn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get sales returns by invoice
   */
  getReturnsByInvoice(invoiceId: number): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(`${this.apiUrl}/invoice/${invoiceId}`);
  }

  /**
   * Get sales returns by car VIN
   */
  getReturnsByVin(vin: string): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(`${this.apiUrl}/vin/${vin}`);
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
   * Export sales returns as PDF
   */
  exportReturnsPDF(filters?: any): Observable<Blob> {
    return this.http.post<Blob>(`${this.apiUrl}/export/pdf`, filters, {
      responseType: 'blob' as any
    });
  }

  /**
   * Export sales returns as Excel
   */
  exportReturnsExcel(filters?: any): Observable<Blob> {
    return this.http.post<Blob>(`${this.apiUrl}/export/excel`, filters, {
      responseType: 'blob' as any
    });
  }
}
