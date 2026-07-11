import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesInvoice } from '../models/sales-invoice.model';
import { Observable, tap } from 'rxjs';
import { InventoryService } from './inventory.service';
import { environment } from '../environments/environment';
import { StoreCarStockDto } from '../models/store-car-stock.model';
import { CustomerOrder } from '../models/customer-order.model';
import { PreparationCharge } from '../models/preparation-charge.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private http = inject(HttpClient);
  private inventoryService = inject(InventoryService);
  private invoices = signal<SalesInvoice[]>([]);
  public invoices$ = this.invoices.asReadonly();
    private apiUrl = environment.origin+ 'api/Sales';
    private apiUrlstock = environment.origin+ 'api/Stocks';
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
  return this.http.get<SalesInvoice[]>(
    `${this.apiUrl}/GetOutstandingByCustomerId/${customerId}`
  );
}
  // جلب جميع فواتير العميل
  getInvoicesByCustomerId(customerId: number): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}?customerId=${customerId}`);
  }
  getInvoiceById(id: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/GetInvoice/${id}`);
  }

  // إضافة فاتورة جديدة
  addInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    const payload: any = {
      ...invoice,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      ownershipTransferStatus: 'Not Started',
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

    return this.http.post<SalesInvoice>(this.apiUrl+'/Create', payload);
  }

  // تحديث فاتورة موجودة
  updateInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/update/${invoice.id}`, invoice);
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

  // جلب مخزون السيارات حسب المتجر
  getStocksByStore(storeId: number): Observable<StoreCarStockDto[]> {
    return this.http.get<StoreCarStockDto[]>(`${environment.origin}api/Stocks/store/${storeId}`);
  }

  // جلب السيارات المتاحة حسب المتجر
  getAvailableCarsByStore(storeId: number): Observable<StoreCarStockDto[]> {
    return this.http.get<StoreCarStockDto[]>(`${this.apiUrl}/availableCars/${storeId}`);
  }

  // إنشاء طلب عميل
  createCustomerOrder(order: CustomerOrder): Observable<CustomerOrder> {
    return this.http.post<CustomerOrder>(`${environment.origin}api/CustomerOrders`, order);
  }

  // جلب طلب عميل بواسطة المعرف (لربط أمر البيع بالفاتورة)
  getCustomerOrderById(id: number): Observable<CustomerOrder> {
    return this.http.get<CustomerOrder>(`${environment.origin}api/CustomerOrders/${id}`);
  }

  // حفظ رسوم التحضير
  savePreparationCharges(charges: PreparationCharge[]): Observable<PreparationCharge[]> {
    return this.http.post<PreparationCharge[]>(`${environment.origin}api/PreparationCharges/CreateBulk`, charges);
  }

  // جلب رسوم التحضير لمركبة معينة
  getPreparationChargesByVehicle(vehicleId: number): Observable<PreparationCharge[]> {
    return this.http.get<PreparationCharge[]>(`${environment.origin}api/PreparationCharges/GetByVehicle/${vehicleId}`);
  }

  // تحديث حالة رسوم التحضير إلى 'Applied'
  markPreparationChargesAsApplied(invoiceId: number): Observable<void> {
    return this.http.post<void>(`${environment.origin}api/PreparationCharges/MarkAsApplied/${invoiceId}`, {});
  }

  // جلب الطلبات المعلقة للعميل
  getPendingCustomerOrders(customerId: number): Observable<CustomerOrder[]> {
    return this.http.get<CustomerOrder[]>(`${environment.origin}api/CustomerOrders/GetPendingByCustomer/${customerId}`);
  }

  // تحديث حالة الطلب إلى 'Invoiced'
  markCustomerOrderAsInvoiced(orderId: number): Observable<void> {
    return this.http.post<void>(`${environment.origin}api/CustomerOrders/MarkAsInvoiced/${orderId}`, {});
  }
}
