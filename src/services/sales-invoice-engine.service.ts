import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  SalesInvoice,
  ProcessOrderToInvoiceDto,
  InvoiceGenerationResult,
  RecordPaymentDto,
  ConfirmDeliveryDto
} from '../models/sales-lifecycle/sales-invoice-engine.model';
import { InvoiceStatus } from '../models/enums/invoice-status.enum';

/**
 * Service for the Sales Invoice Engine
 * Handles invoice generation, ZATCA compliance, and ledger posting
 */
@Injectable({
  providedIn: 'root'
})
export class SalesInvoiceEngineService {
  private readonly apiUrl = `${environment.apiUrl}/api/SalesInvoiceEngine`;

  constructor(private http: HttpClient) {}

  // ==================== Invoice Generation ====================

  /**
   * Process a customer order and generate sales invoice
   * This is the main engine method that:
   * 1. Fetches order, car, and customer data
   * 2. Applies dynamic ledger routing based on sales channel
   * 3. Generates ZATCA-compliant QR code
   * 4. Updates car status to "Sold"
   * 5. Creates double-entry ledger entries
   */
  processOrderToInvoice(dto: ProcessOrderToInvoiceDto): Observable<InvoiceGenerationResult> {
    return this.http.post<InvoiceGenerationResult>(`${this.apiUrl}/process-order`, dto);
  }

  /**
   * Get invoice by ID
   */
  getById(invoiceId: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/${invoiceId}`);
  }

  /**
   * Get invoice by order ID
   */
  getByOrderId(orderId: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/by-order/${orderId}`);
  }

  /**
   * Get all invoices with filtering
   */
  getAll(filters?: {
    status?: InvoiceStatus;
    salesChannel?: number;
    customerId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<SalesInvoice[]> {
    return this.http.post<SalesInvoice[]>(`${this.apiUrl}/search`, filters || {});
  }

  // ==================== Invoice Approval Workflow ====================

  /**
   * Submit invoice for approval (for Sharikat channel exceeding credit limit)
   */
  submitForApproval(invoiceId: number, reason: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${invoiceId}/submit-approval`, { reason });
  }

  /**
   * Approve an invoice
   */
  approve(invoiceId: number, approverNotes?: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${invoiceId}/approve`, { approverNotes });
  }

  /**
   * Reject an invoice
   */
  reject(invoiceId: number, reason: string): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${invoiceId}/reject`, { reason });
  }

  // ==================== Payment Processing ====================

  /**
   * Record a payment against an invoice
   */
  recordPayment(dto: RecordPaymentDto): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/record-payment`, dto);
  }

  /**
   * Get payment history for an invoice
   */
  getPaymentHistory(invoiceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${invoiceId}/payment-history`);
  }

  /**
   * Mark invoice as fully paid
   */
  markAsPaid(invoiceId: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${invoiceId}/mark-paid`, {});
  }

  // ==================== Delivery Management ====================

  /**
   * Confirm delivery of vehicle
   */
  confirmDelivery(dto: ConfirmDeliveryDto): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/confirm-delivery`, dto);
  }

  /**
   * Mark invoice as ready for delivery
   */
  markReadyForDelivery(invoiceId: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.apiUrl}/${invoiceId}/ready-for-delivery`, {});
  }

  // ==================== ZATCA & Compliance ====================

  /**
   * Generate ZATCA-compliant QR code for an invoice
   */
  generateZatcaQrCode(invoiceId: number): Observable<{ qrCode: string }> {
    return this.http.post<{ qrCode: string }>(`${this.apiUrl}/${invoiceId}/generate-qr`, {});
  }

  /**
   * Validate ZATCA compliance
   */
  validateZatcaCompliance(invoiceId: number): Observable<{
    isCompliant: boolean;
    errors: string[];
    warnings: string[];
  }> {
    return this.http.get<any>(`${this.apiUrl}/${invoiceId}/validate-zatca`);
  }

  /**
   * Get invoice in ZATCA XML format
   */
  getZatcaXml(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/zatca-xml`, {
      responseType: 'blob'
    });
  }

  // ==================== Ledger & Accounting ====================

  /**
   * Get ledger entries for an invoice
   */
  getLedgerEntries(invoiceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${invoiceId}/ledger-entries`);
  }

  /**
   * Re-post ledger entries (in case of corrections)
   */
  repostLedgerEntries(invoiceId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${invoiceId}/repost-ledger`, {});
  }

  // ==================== Reports & Analytics ====================

  /**
   * Get invoice summary statistics
   */
  getInvoiceStatistics(dateFrom: string, dateTo: string): Observable<{
    totalInvoices: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    byChannel: any[];
    byStatus: any[];
  }> {
    return this.http.post<any>(`${this.apiUrl}/statistics`, { dateFrom, dateTo });
  }

  /**
   * Get outstanding invoices
   */
  getOutstandingInvoices(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/outstanding`);
  }

  /**
   * Get pending approvals
   */
  getPendingApprovals(): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(`${this.apiUrl}/pending-approvals`);
  }

  // ==================== Document Generation ====================

  /**
   * Generate printable invoice PDF
   */
  generatePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
  }

  /**
   * Send invoice via email
   */
  sendEmail(invoiceId: number, recipientEmail: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/${invoiceId}/send-email`, {
      recipientEmail
    });
  }

  /**
   * Print invoice
   */
  printInvoice(invoiceId: number): void {
    window.open(`${this.apiUrl}/${invoiceId}/print`, '_blank');
  }
}
