import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseOffer } from '../models/purchase-offer.model';
import { CarReceipt } from '../models/car-receipt.model';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { PaymentVoucher } from '../models/payment-voucher.model';
import { Expense } from '../models/expense.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseCycleService {
  private apiUrl = 'api/purchase-cycle'; // Adjust base URL as needed

  constructor(private http: HttpClient) { }

  // PurchaseOffer methods
  getPurchaseOffers(): Observable<PurchaseOffer[]> {
    return this.http.get<PurchaseOffer[]>(`${this.apiUrl}/purchase-offers`);
  }

  getPurchaseOffer(id: number): Observable<PurchaseOffer> {
    return this.http.get<PurchaseOffer>(`${this.apiUrl}/purchase-offers/${id}`);
  }

  createPurchaseOffer(offer: PurchaseOffer): Observable<PurchaseOffer> {
    return this.http.post<PurchaseOffer>(`${this.apiUrl}/purchase-offers`, offer);
  }

  updatePurchaseOffer(id: number, offer: PurchaseOffer): Observable<PurchaseOffer> {
    return this.http.put<PurchaseOffer>(`${this.apiUrl}/purchase-offers/${id}`, offer);
  }

  // CarReceipt methods
  getCarReceipts(): Observable<CarReceipt[]> {
    return this.http.get<CarReceipt[]>(`${this.apiUrl}/car-receipts`);
  }

  getCarReceipt(id: number): Observable<CarReceipt> {
    return this.http.get<CarReceipt>(`${this.apiUrl}/car-receipts/${id}`);
  }

  createCarReceipt(receipt: CarReceipt): Observable<CarReceipt> {
    return this.http.post<CarReceipt>(`${this.apiUrl}/car-receipts`, receipt);
  }

  updateCarReceipt(id: number, receipt: CarReceipt): Observable<CarReceipt> {
    return this.http.put<CarReceipt>(`${this.apiUrl}/car-receipts/${id}`, receipt);
  }

  // PurchaseInvoice methods
  getPurchaseInvoices(): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/purchase-invoices`);
  }

  getPurchaseInvoice(id: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/purchase-invoices/${id}`);
  }

  createPurchaseInvoice(invoice: PurchaseInvoice): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(`${this.apiUrl}/purchase-invoices`, invoice);
  }

  updatePurchaseInvoice(id: number, invoice: PurchaseInvoice): Observable<PurchaseInvoice> {
    return this.http.put<PurchaseInvoice>(`${this.apiUrl}/purchase-invoices/${id}`, invoice);
  }

  // PaymentVoucher methods
  getPaymentVouchers(): Observable<PaymentVoucher[]> {
    return this.http.get<PaymentVoucher[]>(`${this.apiUrl}/payment-vouchers`);
  }

  getPaymentVoucher(id: number): Observable<PaymentVoucher> {
    return this.http.get<PaymentVoucher>(`${this.apiUrl}/payment-vouchers/${id}`);
  }

  createPaymentVoucher(voucher: PaymentVoucher): Observable<PaymentVoucher> {
    return this.http.post<PaymentVoucher>(`${this.apiUrl}/payment-vouchers`, voucher);
  }

  updatePaymentVoucher(id: number, voucher: PaymentVoucher): Observable<PaymentVoucher> {
    return this.http.put<PaymentVoucher>(`${this.apiUrl}/payment-vouchers/${id}`, voucher);
  }

  // Expense methods
  addCarExpense(expense: Expense): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/car-expenses`, expense);
  }

  // Update Car Status
  updateCarStatusToAvailable(carId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/cars/${carId}/status/available`, {});
  }
}