import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalesInvoice } from '../models/sales-invoice.model';
import { Observable, tap, map } from 'rxjs';
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

  /** Some Sales endpoints (GetInvoices/GetInvoice/Create/...) return the raw ApiResponse<T>
   * envelope ({ success, message, data }) instead of a bare T -- the global unwrapping
   * interceptor isn't actually wired up (provideHttpClient() lacks withInterceptorsFromDi()), so
   * without this every .reduce()/.map() on a "list" response throws "not a function". Safe
   * either way: passes bare responses through unchanged. */
  private unwrap<T>(response: any): T {
    return response && typeof response === 'object' && 'data' in response ? response.data : response;
  }

  // جلب جميع الفواتير
  getInvoices(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(this.apiUrl).pipe(map(res => this.unwrap<SalesInvoice[]>(res)));
  }

  // جلب فواتير غير مدفوعة لعميل
getOutstandingInvoicesByCustomerId(customerId: number): Observable<SalesInvoice[]> {
  return this.http.get<SalesInvoice[]>(
    `${this.apiUrl}/GetOutstandingByCustomerId/${customerId}`
  ).pipe(map(res => this.unwrap<SalesInvoice[]>(res)));
}
  // جلب جميع فواتير العميل
  getInvoicesByCustomerId(customerId: number): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}?customerId=${customerId}`).pipe(map(res => this.unwrap<SalesInvoice[]>(res)));
  }
  getInvoiceById(id: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/GetInvoice/${id}`).pipe(map(res => this.unwrap<SalesInvoice>(res)));
  }

  /** Phase cancellation lifecycle: reverses inventory + accounting for a posted sales invoice. */
  cancelInvoice(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/CancelInvoice/${id}`, {});
  }

  // إضافة فاتورة جديدة
  addInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    // The backend derives amountPaid/amountDue/status itself from isCash + downPayment (cash
    // invoices are auto-marked fully paid; credit invoices net off downPayment) - it does not
    // trust client-sent amountPaid/amountDue on create.
    const payload: any = {
      ...invoice,
      ownershipTransferStatus: 'Not Started',
      isArchived: false,
    };

    return this.http.post<SalesInvoice>(this.apiUrl+'/Create', payload).pipe(map(res => this.unwrap<SalesInvoice>(res)));
  }

  // تحديث فاتورة موجودة
  updateInvoice(invoice: SalesInvoice): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/update/${invoice.id}`, invoice);
  }

  // حذف فاتورة
  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  // بدء نقل الملكية
  initiateOwnershipTransfer(invoiceId: number): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/OwnershipTransfer/${invoiceId}`, {});
  }

  // تطبيق الدفع على فاتورة
  applyPayment(invoiceId: number, paymentAmount: number): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/ApplyPayment/${invoiceId}`, paymentAmount)
      .pipe(map(res => this.unwrap<SalesInvoice>(res)));
  }

  // أرشفة فاتورة
  archiveInvoice(id: number): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/Archive/${id}`, {})
      .pipe(map(res => this.unwrap<SalesInvoice>(res)));
  }

  // إلغاء أرشفة فاتورة
  unarchiveInvoice(id: number): Observable<SalesInvoice> {
    return this.http.put<SalesInvoice>(`${this.apiUrl}/Unarchive/${id}`, {})
      .pipe(map(res => this.unwrap<SalesInvoice>(res)));
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
