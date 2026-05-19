import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SharikatSalesOrder,
  CreateSharikatSalesOrderDto,
  ConvertQuotationToOrderDto,
  CreditLimitCheckDto,
  CreditLimitCheckResult
} from '../models/sales-lifecycle/sharikat-sales-order.model';

/**
 * Service for managing Sharikat (Corporate/Fleet) Sales operations
 */
@Injectable({
  providedIn: 'root'
})
export class SharikatSalesService {
  private readonly apiUrl = `${environment.apiUrl}/api/SharikatSales`;

  constructor(private http: HttpClient) {}

  // ==================== Sales Orders ====================

  /**
   * Get all Sharikat sales orders with optional filtering
   */
  getAll(filters?: {
    status?: string;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
    accountManagerId?: number;
    requiresApproval?: boolean;
  }): Observable<SharikatSalesOrder[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.customerId) params = params.set('customerId', filters.customerId.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.accountManagerId) params = params.set('accountManagerId', filters.accountManagerId.toString());
      if (filters.requiresApproval !== undefined) params = params.set('requiresApproval', filters.requiresApproval.toString());
    }
    return this.http.get<SharikatSalesOrder[]>(this.apiUrl, { params });
  }

  /**
   * Get a single Sharikat sales order by ID
   */
  getById(id: number): Observable<SharikatSalesOrder> {
    return this.http.get<SharikatSalesOrder>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new Sharikat sales order
   */
  create(dto: CreateSharikatSalesOrderDto): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(this.apiUrl, dto);
  }

  /**
   * Update an existing Sharikat sales order
   */
  update(id: number, dto: Partial<CreateSharikatSalesOrderDto>): Observable<SharikatSalesOrder> {
    return this.http.put<SharikatSalesOrder>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Convert an approved quotation to a sales order
   * This is a key workflow for corporate sales
   */
  convertQuotationToOrder(dto: ConvertQuotationToOrderDto): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/convert-quotation`, dto);
  }

  /**
   * Submit order for approval (for credit sales exceeding threshold)
   */
  submitForApproval(orderId: number, notes?: string): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/${orderId}/submit-approval`, { notes });
  }

  /**
   * Approve a Sharikat sales order
   */
  approve(orderId: number, approverNotes?: string): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/${orderId}/approve`, { approverNotes });
  }

  /**
   * Reject a Sharikat sales order
   */
  reject(orderId: number, reason: string): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/${orderId}/reject`, { reason });
  }

  /**
   * Cancel a Sharikat sales order
   */
  cancel(orderId: number, reason: string): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/${orderId}/cancel`, { reason });
  }

  /**
   * Delete a Sharikat sales order (only if in Draft status)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== Credit Management ====================

  /**
   * Check credit limit for a customer
   * Returns whether the requested amount is within limit or requires approval
   */
  checkCreditLimit(dto: CreditLimitCheckDto): Observable<CreditLimitCheckResult> {
    return this.http.post<CreditLimitCheckResult>(`${this.apiUrl}/check-credit`, dto);
  }

  /**
   * Get customer's credit status
   */
  getCustomerCreditStatus(customerId: number): Observable<{
    creditLimit: number;
    currentOutstanding: number;
    availableCredit: number;
    overdueAmount: number;
    paymentHistory: any[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/customer/${customerId}/credit-status`);
  }

  // ==================== Vehicle Allocation ====================

  /**
   * Allocate specific VINs to an order
   */
  allocateVehicles(orderId: number, vehicleIds: number[]): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(`${this.apiUrl}/${orderId}/allocate-vehicles`, {
      vehicleIds
    });
  }

  /**
   * Update delivery status for specific vehicles
   */
  updateVehicleDeliveryStatus(
    orderId: number,
    vehicleId: number,
    status: 'Delivered',
    deliveryDate: string,
    notes?: string
  ): Observable<SharikatSalesOrder> {
    return this.http.post<SharikatSalesOrder>(
      `${this.apiUrl}/${orderId}/vehicle/${vehicleId}/delivery`,
      { status, deliveryDate, notes }
    );
  }

  // ==================== Document Management ====================

  /**
   * Upload purchase order document
   */
  uploadPurchaseOrder(orderId: number, file: File): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filePath: string }>(
      `${this.apiUrl}/${orderId}/upload-po`,
      formData
    );
  }

  /**
   * Upload attachment
   */
  uploadAttachment(orderId: number, file: File, description?: string): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    return this.http.post<{ filePath: string }>(
      `${this.apiUrl}/${orderId}/upload-attachment`,
      formData
    );
  }

  // ==================== Reports & Analytics ====================

  /**
   * Get fleet sales statistics
   */
  getFleetSalesStatistics(dateFrom: string, dateTo: string): Observable<any> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);
    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }

  /**
   * Get top corporate customers
   */
  getTopCorporateCustomers(limit: number = 10): Observable<any[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/top-customers`, { params });
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): Observable<SharikatSalesOrder[]> {
    return this.http.get<SharikatSalesOrder[]>(`${this.apiUrl}/pending-approvals`);
  }

  /**
   * Get customer order history
   */
  getCustomerOrderHistory(customerId: number): Observable<SharikatSalesOrder[]> {
    return this.http.get<SharikatSalesOrder[]>(`${this.apiUrl}/customer/${customerId}/history`);
  }
}
