import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { BankPartner, BankQuotation, CreateBankQuotationDto, VinLockCandidate } from '../models/bank-financing/bank-quotation.model';
import { BankApproval, CreateBankApprovalDto } from '../models/bank-financing/bank-approval.model';
import { BankInvoice, FinalizeBankInvoiceDto } from '../models/bank-financing/bank-invoice.model';

@Injectable({
  providedIn: 'root'
})
export class BankFinancingService {
  private readonly baseUrl = `${environment.origin}api/bank`;

  constructor(private http: HttpClient) {}

  // ==================== Quotation & VIN Lock ====================

  getVerifiedBankPartners(): Observable<BankPartner[]> {
    return this.http.get<BankPartner[]>(`${this.baseUrl}/partners`, {
      params: { verified: 'true' }
    });
  }

  getAvailableVinsForLock(): Observable<VinLockCandidate[]> {
    return this.http.get<VinLockCandidate[]>(`${environment.origin}api/inventory`, {
      params: { status: 'Available' }
    });
  }

  createQuotation(dto: CreateBankQuotationDto): Observable<BankQuotation> {
    return this.http.post<BankQuotation>(`${this.baseUrl}/quotations`, dto);
  }

  // ==================== LPO & Approval ====================

  getPendingBankQuotes(): Observable<BankQuotation[]> {
    return this.http.get<BankQuotation[]>(`${this.baseUrl}/quotations`, {
      params: { status: 'Reserved_Bank_Pending' }
    });
  }

  createApproval(dto: CreateBankApprovalDto): Observable<BankApproval> {
    return this.http.post<BankApproval>(`${this.baseUrl}/approvals`, dto);
  }

  // ==================== Invoice & Settlement ====================

  getApprovalById(approvalId: number): Observable<BankApproval> {
    return this.http.get<BankApproval>(`${this.baseUrl}/approvals/${approvalId}`);
  }

  getSplitBillingPreview(approvalId: number): Observable<BankInvoice> {
    return this.http.get<BankInvoice>(`${this.baseUrl}/approvals/${approvalId}/billing-preview`);
  }

  finalizeInvoice(dto: FinalizeBankInvoiceDto): Observable<BankInvoice> {
    return this.http.post<BankInvoice>(`${this.baseUrl}/invoices/finalize`, dto);
  }
}
