import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../environments/environment';
import { ServiceInvoice } from '../models/service-invoice.model';

/**
 * Data access for Service Invoices (workshop / maintenance billing).
 * Follows the same conventions as PurchasesService: `environment.origin`-based
 * URL and a defensive `unwrap` for the backend's ApiResponse<T> envelope.
 */
@Injectable({
  providedIn: 'root',
})
export class ServiceInvoiceService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/ServiceInvoices';

  /** GetById returns the raw ApiResponse<T> envelope ({ success, message, data })
   *  instead of a bare ServiceInvoice -- unwrap once here so every consumer can
   *  trust the declared Observable<ServiceInvoice> literally. Passes bare
   *  responses through unchanged (same backend inconsistency documented in
   *  PurchasesService.unwrap / SalesService.unwrap). */
  private unwrap<T>(response: any): T {
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  }

  getInvoices(): Observable<ServiceInvoice[]> {
    return this.http.get<ServiceInvoice[]>(this.apiUrl + '/GetAll');
  }

  getInvoiceById(id: number): Observable<ServiceInvoice> {
    return this.http.get<ServiceInvoice>(`${this.apiUrl}/GetById/${id}`)
      .pipe(map(res => this.unwrap<ServiceInvoice>(res)));
  }

  addInvoice(invoice: Omit<ServiceInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt'>): Observable<ServiceInvoice> {
    const payload: any = { ...invoice, isArchived: false };
    return this.http.post<ServiceInvoice>(this.apiUrl + '/Create', payload);
  }

  updateInvoice(id: number, invoice: Omit<ServiceInvoice, 'id' | 'amountPaid' | 'amountDue' | 'createdAt' | 'updatedAt'>): Observable<ServiceInvoice> {
    const payload: any = { ...invoice, isArchived: false };
    return this.http.put<ServiceInvoice>(`${this.apiUrl}/Update/${id}`, payload);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}