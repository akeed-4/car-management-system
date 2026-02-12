import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Quotation } from '../models/quotation.model';
import { SalesInvoice } from '../models/sales-invoice.model';
import { ReceiptVoucher } from '../models/receipt-voucher.model';

@Injectable({
  providedIn: 'root'
})
export class SalesCycleService {
  private apiUrl = 'api/sales-cycle'; // Adjust base URL as needed

  constructor(private http: HttpClient) { }

  // Quotation methods
  getQuotations(): Observable<Quotation[]> {
    return this.http.get<Quotation[]>(`${this.apiUrl}/quotations`);
  }

  getQuotation(id: number): Observable<Quotation> {
    return this.http.get<Quotation>(`${this.apiUrl}/quotations/${id}`);
  }

  createQuotation(quotation: Quotation): Observable<Quotation> {
    return this.http.post<Quotation>(`${this.apiUrl}/quotations`, quotation);
  }

  updateQuotation(id: number, quotation: Quotation): Observable<Quotation> {
    return this.http.put<Quotation>(`${this.apiUrl}/quotations/${id}`, quotation);
  }

  // Reserve Car
  reserveCar(carId: number, customerId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cars/${carId}/reserve`, customerId);
  }

  updateCarStatusToReserved(carId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cars/${carId}/status/reserved`, {});
  }

  updateCarStatusToSold(carId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cars/${carId}/status/sold`, {});
  }

  // ReceiptVoucher methods
  getReceiptVouchers(): Observable<ReceiptVoucher[]> {
    return this.http.get<ReceiptVoucher[]>(`${this.apiUrl}/receipt-vouchers`);
  }

  getReceiptVoucher(id: number): Observable<ReceiptVoucher> {
    return this.http.get<ReceiptVoucher>(`${this.apiUrl}/receipt-vouchers/${id}`);
  }

  createReceiptVoucher(voucher: ReceiptVoucher): Observable<ReceiptVoucher> {
    return this.http.post<ReceiptVoucher>(`${this.apiUrl}/receipt-vouchers`, voucher);
  }

  updateReceiptVoucher(id: number, voucher: ReceiptVoucher): Observable<ReceiptVoucher> {
    return this.http.put<ReceiptVoucher>(`${this.apiUrl}/receipt-vouchers/${id}`, voucher);
  }

  // SalesInvoice methods
  getSalesInvoices(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/sales-invoices`);
  }

  getSalesInvoice(id: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/sales-invoices/${id}`);
  }

  createSalesInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/sales-invoices`, invoice);
  }

  updateSalesInvoice(id: number, invoice: SalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/sales-invoices/${id}`, invoice);
  }
}