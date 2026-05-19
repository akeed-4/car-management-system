import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AfradSalesOrder,
  CreateAfradSalesOrderDto,
  ReserveVehicleDto
} from '../models/sales-lifecycle/afrad-sales-order.model';
import {
  AdvancePaymentVoucher,
  CreateAdvancePaymentVoucherDto,
  LinkVoucherToOrderDto
} from '../models/advance-payment-voucher.model';
import { environment } from '../environments/environment';

/**
 * Service for managing Afrad (Individual/Retail) Sales operations
 */
@Injectable({
  providedIn: 'root'
})
export class AfradSalesService {
  private readonly apiUrl = `${environment.origin}/api/AfradSales`;
  private readonly voucherApiUrl = `${environment.origin}/api/AdvancePaymentVouchers`;

  constructor(private http: HttpClient) {}

  // ==================== Sales Orders ====================

  /**
   * Get all Afrad sales orders with optional filtering
   */
  getAll(filters?: {
    status?: string;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
    salespersonId?: number;
  }): Observable<AfradSalesOrder[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.customerId) params = params.set('customerId', filters.customerId.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.salespersonId) params = params.set('salespersonId', filters.salespersonId.toString());
    }
    return this.http.get<AfradSalesOrder[]>(this.apiUrl, { params });
  }

  /**
   * Get a single Afrad sales order by ID
   */
  getById(id: number): Observable<AfradSalesOrder> {
    return this.http.get<AfradSalesOrder>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new Afrad sales order
   */
  create(dto: CreateAfradSalesOrderDto): Observable<AfradSalesOrder> {
    return this.http.post<AfradSalesOrder>(this.apiUrl, dto);
  }

  /**
   * Update an existing Afrad sales order
   */
  update(id: number, dto: Partial<CreateAfradSalesOrderDto>): Observable<AfradSalesOrder> {
    return this.http.put<AfradSalesOrder>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Reserve a vehicle by linking an advance payment voucher
   * This automatically updates the car status from "Available" to "Reserved"
   */
  reserveVehicle(dto: ReserveVehicleDto): Observable<AfradSalesOrder> {
    return this.http.post<AfradSalesOrder>(`${this.apiUrl}/reserve`, dto);
  }

  /**
   * Approve an Afrad sales order
   */
  approve(orderId: number, notes?: string): Observable<AfradSalesOrder> {
    return this.http.post<AfradSalesOrder>(`${this.apiUrl}/${orderId}/approve`, { notes });
  }

  /**
   * Cancel an Afrad sales order
   */
  cancel(orderId: number, reason: string): Observable<AfradSalesOrder> {
    return this.http.post<AfradSalesOrder>(`${this.apiUrl}/${orderId}/cancel`, { reason });
  }

  /**
   * Delete an Afrad sales order (only if in Draft status)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== Advance Payment Vouchers ====================

  /**
   * Get all advance payment vouchers
   */
  getAllVouchers(filters?: {
    customerId?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<AdvancePaymentVoucher[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.customerId) params = params.set('customerId', filters.customerId.toString());
      if (filters.status) params = params.set('status', filters.status);
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
    }
    return this.http.get<AdvancePaymentVoucher[]>(this.voucherApiUrl, { params });
  }

  /**
   * Get available (unconsumed) vouchers for a customer
   */
  getAvailableVouchersForCustomer(customerId: number): Observable<AdvancePaymentVoucher[]> {
    return this.http.get<AdvancePaymentVoucher[]>(
      `${this.voucherApiUrl}/customer/${customerId}/available`
    );
  }

  /**
   * Get a single voucher by ID
   */
  getVoucherById(id: number): Observable<AdvancePaymentVoucher> {
    return this.http.get<AdvancePaymentVoucher>(`${this.voucherApiUrl}/${id}`);
  }

  /**
   * Create a new advance payment voucher
   */
  createVoucher(dto: CreateAdvancePaymentVoucherDto): Observable<AdvancePaymentVoucher> {
    return this.http.post<AdvancePaymentVoucher>(this.voucherApiUrl, dto);
  }

  /**
   * Link a voucher to an order
   */
  linkVoucherToOrder(dto: LinkVoucherToOrderDto): Observable<AdvancePaymentVoucher> {
    return this.http.post<AdvancePaymentVoucher>(`${this.voucherApiUrl}/link`, dto);
  }

  /**
   * Refund a voucher
   */
  refundVoucher(voucherId: number, reason: string): Observable<AdvancePaymentVoucher> {
    return this.http.post<AdvancePaymentVoucher>(
      `${this.voucherApiUrl}/${voucherId}/refund`,
      { reason }
    );
  }

  // ==================== Reports & Analytics ====================

  /**
   * Get sales statistics for Afrad channel
   */
  getSalesStatistics(dateFrom: string, dateTo: string): Observable<any> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);
    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }

  /**
   * Get customer purchase history
   */
  getCustomerPurchaseHistory(customerId: number): Observable<AfradSalesOrder[]> {
    return this.http.get<AfradSalesOrder[]>(`${this.apiUrl}/customer/${customerId}/history`);
  }
}
