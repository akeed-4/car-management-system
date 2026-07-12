import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { BankPartner, BankQuotation, CreateBankQuotationDto } from '../models/bank-financing/bank-quotation.model';
import { CreateBankApprovalDto } from '../models/bank-financing/bank-approval.model';

@Injectable({
  providedIn: 'root'
})
export class BankFinancingService {
  private readonly baseUrl = `${environment.origin}api/bank`;

  constructor(private http: HttpClient) {}

  // ==================== Quotation & VIN Lock ====================

  getBankPartners(): Observable<BankPartner[]> {
    return this.http.get<BankPartner[]>(`${this.baseUrl}/partners`);
  }

  createQuotation(dto: CreateBankQuotationDto): Observable<BankQuotation> {
    return this.http.post<BankQuotation>(`${this.baseUrl}/quotations`, dto);
  }

  getQuotationById(id: number): Observable<BankQuotation> {
    return this.http.get<BankQuotation>(`${this.baseUrl}/quotations/${id}`);
  }

  getQuotationsByStatus(status: string): Observable<BankQuotation[]> {
    return this.http.get<BankQuotation[]>(`${this.baseUrl}/quotations`, { params: { status } });
  }

  getAllBankQuotations(): Observable<BankQuotation[]> {
    return this.http.get<BankQuotation[]>(`${this.baseUrl}/quotations`);
  }

  // ==================== LPO & Approval ====================

  createApproval(dto: CreateBankApprovalDto): Observable<BankQuotation> {
    return this.http.post<BankQuotation>(`${this.baseUrl}/approvals`, dto);
  }
}
