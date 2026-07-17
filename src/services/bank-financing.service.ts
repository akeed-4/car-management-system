import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { BankPartner, BankQuotation, CreateBankQuotationDto, FinalizeBankInvoiceDto } from '../models/bank-financing/bank-quotation.model';
import { CreateBankApprovalDto } from '../models/bank-financing/bank-approval.model';
import { BankOrderDeliveryDetails, BankOrderLookup, BankVehicleDelivery, CreateBankInvoiceFromDeliveryDto, CreateBankVehicleDeliveryDto } from '../models/bank-financing/bank-vehicle-delivery.model';
import { UninvoicedDeliveryLookup } from '../models/sales/uninvoiced-delivery.model';
import { SalesInvoice } from '../models/sales-invoice.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class BankFinancingService {
  private readonly baseUrl = `${environment.origin}api/BankFinancingSales`;

  constructor(private http: HttpClient) {}

  // ==================== Quotation & VIN Lock ====================

  getBankPartners(): Observable<BankPartner[]> {
    return this.http.get<ApiResponse<BankPartner[]>>(`${this.baseUrl}/partners`).pipe(
      map(res => res.data)
    );
  }

  createQuotation(dto: CreateBankQuotationDto): Observable<BankQuotation> {
    return this.http.post<ApiResponse<BankQuotation>>(`${this.baseUrl}/quotations`, dto).pipe(
      map(res => res.data)
    );
  }

  getQuotationById(id: number): Observable<BankQuotation> {
    return this.http.get<ApiResponse<BankQuotation>>(`${this.baseUrl}/quotations/${id}`).pipe(
      map(res => res.data)
    );
  }

  getQuotationsByStatus(status: string): Observable<BankQuotation[]> {
    return this.http.get<ApiResponse<BankQuotation[]>>(`${this.baseUrl}/quotations`, { params: { status } }).pipe(
      map(res => res.data)
    );
  }

  getAllBankQuotations(): Observable<BankQuotation[]> {
    return this.http.get<ApiResponse<BankQuotation[]>>(`${this.baseUrl}/quotations`).pipe(
      map(res => res.data)
    );
  }

  // ==================== LPO & Approval ====================

  createApproval(dto: CreateBankApprovalDto): Observable<BankQuotation> {
    return this.http.post<ApiResponse<BankQuotation>>(`${this.baseUrl}/approvals`, dto).pipe(
      map(res => res.data)
    );
  }

  // ==================== Flexible Invoicing ====================

  /** Invoices directly from a Bank_Approved quotation -- the "Quotation" invoice source. */
  finalizeInvoice(dto: FinalizeBankInvoiceDto): Observable<SalesInvoice> {
    return this.http.post<ApiResponse<SalesInvoice>>(`${this.baseUrl}/invoices/finalize`, dto).pipe(
      map(res => res.data)
    );
  }

  // ==================== Vehicle Delivery ====================

  getOrdersEligibleForDelivery(): Observable<BankOrderLookup[]> {
    return this.http.get<ApiResponse<BankOrderLookup[]>>(`${this.baseUrl}/orders/eligible-for-delivery`).pipe(
      map(res => res.data)
    );
  }

  getOrderDeliveryDetails(bankQuotationId: number): Observable<BankOrderDeliveryDetails> {
    return this.http.get<ApiResponse<BankOrderDeliveryDetails>>(`${this.baseUrl}/orders/${bankQuotationId}/delivery-details`).pipe(
      map(res => res.data)
    );
  }

  createVehicleDelivery(dto: CreateBankVehicleDeliveryDto): Observable<BankVehicleDelivery> {
    return this.http.post<ApiResponse<BankVehicleDelivery>>(`${this.baseUrl}/deliveries`, dto).pipe(
      map(res => res.data)
    );
  }

  getVehicleDeliveries(): Observable<BankVehicleDelivery[]> {
    return this.http.get<ApiResponse<BankVehicleDelivery[]>>(`${this.baseUrl}/deliveries`).pipe(
      map(res => res.data)
    );
  }

  getVehicleDeliveryById(id: number): Observable<BankVehicleDelivery> {
    return this.http.get<ApiResponse<BankVehicleDelivery>>(`${this.baseUrl}/deliveries/${id}`).pipe(
      map(res => res.data)
    );
  }

  getUninvoicedDeliveries(): Observable<UninvoicedDeliveryLookup[]> {
    return this.http.get<ApiResponse<UninvoicedDeliveryLookup[]>>(`${this.baseUrl}/deliveries/uninvoiced`).pipe(
      map(res => res.data)
    );
  }

  createInvoiceFromDelivery(dto: CreateBankInvoiceFromDeliveryDto): Observable<SalesInvoice> {
    return this.http.post<ApiResponse<SalesInvoice>>(`${this.baseUrl}/invoices/from-delivery`, dto).pipe(
      map(res => res.data)
    );
  }
}
