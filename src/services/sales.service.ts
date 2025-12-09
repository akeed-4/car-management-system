import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesInvoice } from '../types/sales-invoice.model';
import { Observable, tap } from 'rxjs';
import { InventoryService } from './inventory.service';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private http = inject(HttpClient);
  private inventoryService = inject(InventoryService);
  private apiUrl = 'https://api.example.com/sales-invoices'; // ضع رابط API الحقيقي هنا
  private invoices = signal<SalesInvoice[]>([]);
  public invoices$ = this.invoices.asReadonly();

  constructor() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.getInvoices().subscribe(invoices => this.invoices.set(invoices));
  }

  // جلب جميع الفواتير
  getInvoices(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(this.apiUrl);
  }

  // جلب فواتير غير مدفوعة لعميل
  getOutstandingInvoicesByCustomerId(customerId: number): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/outstanding?customerId=${customerId}`);
  }

  // جلب جميع فواتير العميل
  getInvoicesByCustomerId(customerId: number): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}?customerId=${customerId}`);
  }
  getInvoiceById(id: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/${id}`);
  }

  // إضافة فاتورة جديدة
  addInvoice(invoice: Omit<SalesInvoice, 'id' | 'amountPaid' | 'amountDue' | 'ownershipTransferStatus'>): Observable<SalesInvoice> {
    const newInvoice = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      ownershipTransferStatus: 'Not Started',
      isArchived: false,
    };
    return this.http.post<SalesInvoice>(this.apiUrl, newInvoice);
  }

  // تحديث فاتورة موجودة
  updateInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/${invoice.id}`, invoice);
  }

  // حذف فاتورة
  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // بدء نقل الملكية
  initiateOwnershipTransfer(invoiceId: number): Observable<SalesInvoice> {
    const transferUrl = `${this.apiUrl}/${invoiceId}/transfer-ownership`;
    return this.http.post<SalesInvoice>(transferUrl, {});
  }

  // تطبيق الدفع على فاتورة
  applyPayment(invoiceId: number, paymentAmount: number): Observable<SalesInvoice> {
    const paymentUrl = `${this.apiUrl}/${invoiceId}/apply-payment`;
    return this.http.post<SalesInvoice>(paymentUrl, { paymentAmount });
  }

  // أرشفة فاتورة
  archiveInvoice(id: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${id}/archive`, {});
  }

  // إلغاء أرشفة فاتورة
  unarchiveInvoice(id: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${id}/unarchive`, {});
  }
}
