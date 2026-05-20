import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BunukSalesOrder,
  CreateBunukSalesOrderDto,
  SubmitFinanceApplicationDto,
  UpdateTaameedInfoDto,
  RecordBankSettlementDto,
  FinanceCalculationResult
} from '../models/sales-lifecycle/bunuk-sales-order.model';
import { environment } from '../environments/environment';

/**
 * Service for managing Bunuk (Bank/Finance) Sales operations
 */
@Injectable({
  providedIn: 'root'
})
export class BunukSalesService {
  private readonly apiUrl = `${environment.origin}/api/BunukSales`;

  constructor(private http: HttpClient) {}

  // ==================== Sales Orders ====================

  /**
   * Get all Bunuk sales orders with optional filtering
   */
  getAll(filters?: {
    status?: string;
    applicationStatus?: string;
    customerId?: number;
    bankId?: number;
    dateFrom?: string;
    dateTo?: string;
    salespersonId?: number;
  }): Observable<BunukSalesOrder[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.applicationStatus) params = params.set('applicationStatus', filters.applicationStatus);
      if (filters.customerId) params = params.set('customerId', filters.customerId.toString());
      if (filters.bankId) params = params.set('bankId', filters.bankId.toString());
      if (filters.dateFrom) params = params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params = params.set('dateTo', filters.dateTo);
      if (filters.salespersonId) params = params.set('salespersonId', filters.salespersonId.toString());
    }
    return this.http.get<BunukSalesOrder[]>(this.apiUrl, { params });
  }

  /**
   * Get a single Bunuk sales order by ID
   */
  getById(id: number): Observable<BunukSalesOrder> {
    return this.http.get<BunukSalesOrder>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new Bunuk sales order
   */
  create(dto: CreateBunukSalesOrderDto): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(this.apiUrl, dto);
  }

  /**
   * Update an existing Bunuk sales order
   */
  update(id: number, dto: Partial<CreateBunukSalesOrderDto>): Observable<BunukSalesOrder> {
    return this.http.put<BunukSalesOrder>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Delete a Bunuk sales order (only if in Draft status)
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ==================== Finance Calculations ====================

  /**
   * Calculate finance terms (installment, profit, etc.)
   */
  calculateFinance(
    vehiclePrice: number,
    downPaymentPercentage: number,
    financeTerm: number,
    profitRate: number,
    additionalCharges?: {
      adminFees?: number;
      insuranceAmount?: number;
      registrationFees?: number;
      insuranceFees?: number;
      otherFees?: number;
    }
  ): Observable<FinanceCalculationResult> {
    return this.http.post<FinanceCalculationResult>(`${this.apiUrl}/calculate-finance`, {
      vehiclePrice,
      downPaymentPercentage,
      financeTerm,
      profitRate,
      ...additionalCharges
    });
  }

  // ==================== Finance Application Workflow ====================

  /**
   * Submit finance application to bank
   */
  submitFinanceApplication(dto: SubmitFinanceApplicationDto): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/submit-application`, dto);
  }

  /**
   * Update Taameed information (bank approval tracking)
   */
  updateTaameedInfo(dto: UpdateTaameedInfoDto): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/update-taameed`, dto);
  }

  /**
   * Mark application as bank approved
   */
  markBankApproved(orderId: number, approvalDate: string, notes?: string): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/${orderId}/bank-approved`, {
      approvalDate,
      notes
    });
  }

  /**
   * Mark application as bank rejected
   */
  markBankRejected(orderId: number, rejectionReason: string): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/${orderId}/bank-rejected`, {
      rejectionReason
    });
  }

  /**
   * Update application status
   */
  updateApplicationStatus(
    orderId: number,
    status: string,
    notes?: string
  ): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/${orderId}/update-status`, {
      status,
      notes
    });
  }

  // ==================== Document Management ====================

  /**
   * Upload required document
   */
  uploadDocument(
    orderId: number,
    documentType: string,
    file: File
  ): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    return this.http.post<{ filePath: string }>(
      `${this.apiUrl}/${orderId}/upload-document`,
      formData
    );
  }

  /**
   * Upload Taameed document
   */
  uploadTaameedDocument(orderId: number, file: File): Observable<{ filePath: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ filePath: string }>(
      `${this.apiUrl}/${orderId}/upload-taameed`,
      formData
    );
  }

  /**
   * Mark document as received
   */
  markDocumentReceived(
    orderId: number,
    documentId: number,
    receivedDate: string
  ): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(
      `${this.apiUrl}/${orderId}/document/${documentId}/received`,
      { receivedDate }
    );
  }

  /**
   * Get documents checklist
   */
  getDocumentsChecklist(orderId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${orderId}/documents-checklist`);
  }

  // ==================== Bank Settlement ====================

  /**
   * Record bank settlement
   */
  recordBankSettlement(dto: RecordBankSettlementDto): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/record-settlement`, dto);
  }

  /**
   * Get pending settlements
   */
  getPendingSettlements(): Observable<BunukSalesOrder[]> {
    return this.http.get<BunukSalesOrder[]>(`${this.apiUrl}/pending-settlements`);
  }

  // ==================== Status Tracking ====================

  /**
   * Get orders pending financing approval
   */
  getPendingFinancingApproval(): Observable<BunukSalesOrder[]> {
    return this.http.get<BunukSalesOrder[]>(`${this.apiUrl}/pending-financing`);
  }

  /**
   * Get orders with received Taameed
   */
  getTaameedReceived(): Observable<BunukSalesOrder[]> {
    return this.http.get<BunukSalesOrder[]>(`${this.apiUrl}/taameed-received`);
  }

  /**
   * Cancel finance application
   */
  cancelApplication(orderId: number, reason: string): Observable<BunukSalesOrder> {
    return this.http.post<BunukSalesOrder>(`${this.apiUrl}/${orderId}/cancel`, { reason });
  }

  // ==================== Reports & Analytics ====================

  /**
   * Get finance sales statistics
   */
  getFinanceSalesStatistics(dateFrom: string, dateTo: string): Observable<any> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);
    return this.http.get(`${this.apiUrl}/statistics`, { params });
  }

  /**
   * Get bank-wise performance
   */
  getBankPerformance(dateFrom: string, dateTo: string): Observable<any[]> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);
    return this.http.get<any[]>(`${this.apiUrl}/bank-performance`, { params });
  }

  /**
   * Get approval rate analytics
   */
  getApprovalRateAnalytics(bankId?: number): Observable<any> {
    let params = new HttpParams();
    if (bankId) params = params.set('bankId', bankId.toString());
    return this.http.get(`${this.apiUrl}/approval-rate`, { params });
  }

  /**
   * Get customer finance history
   */
  getCustomerFinanceHistory(customerId: number): Observable<BunukSalesOrder[]> {
    return this.http.get<BunukSalesOrder[]>(`${this.apiUrl}/customer/${customerId}/history`);
  }
}
