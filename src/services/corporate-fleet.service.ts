import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CorporateQuotation, CreateCorporateQuotationDto } from '../models/corporate/corporate-quotation.model';
import { CorporateOrder, CreateCorporateOrderDto } from '../models/corporate/corporate-order.model';
import { CorporateBatchResult, DeliveryNoteResult, OrderFulfillmentProgress, ProcessBatchDto, RemainingVinCandidate } from '../models/corporate/corporate-dispatch.model';

export interface CreditSummary {
  isApproved: boolean;
  creditLimit: number;
  outstandingBalance: number;
  availableCredit: number;
  requestedAmount: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CorporateFleetService {
  private readonly baseUrl = `${environment.origin}api/corporate`;

  constructor(private http: HttpClient) {}

  // ==================== Quotations ====================

  createQuotation(dto: CreateCorporateQuotationDto): Observable<CorporateQuotation> {
    return this.http.post<CorporateQuotation>(`${this.baseUrl}/quotations`, dto);
  }

  getQuotationById(id: number): Observable<CorporateQuotation> {
    return this.http.get<CorporateQuotation>(`${this.baseUrl}/quotations/${id}`);
  }

  getSubmittedQuotations(): Observable<CorporateQuotation[]> {
    return this.http.get<CorporateQuotation[]>(`${this.baseUrl}/quotations`, {
      params: { status: 'Approved' }
    });
  }

  getCreditSummary(customerId: number): Observable<CreditSummary> {
    return this.http.get<CreditSummary>(`${this.baseUrl}/customers/${customerId}/credit-summary`);
  }

  // ==================== Orders ====================

  createOrder(dto: CreateCorporateOrderDto): Observable<CorporateOrder> {
    return this.http.post<CorporateOrder>(`${this.baseUrl}/orders`, dto);
  }

  getApprovedOrders(): Observable<CorporateOrder[]> {
    return this.http.get<CorporateOrder[]>(`${this.baseUrl}/orders`, {
      params: { status: 'Approved' }
    });
  }

  getOrders(status?: string): Observable<CorporateOrder[]> {
    return this.http.get<CorporateOrder[]>(`${this.baseUrl}/orders`, {
      params: status ? { status } : {}
    });
  }

  getOrderById(id: number): Observable<CorporateOrder> {
    return this.http.get<CorporateOrder>(`${this.baseUrl}/orders/${id}`);
  }

  // ==================== Batch Dispatch ====================

  getFulfillmentProgress(orderId: number): Observable<OrderFulfillmentProgress> {
    return this.http.get<OrderFulfillmentProgress>(`${this.baseUrl}/orders/${orderId}/fulfillment`);
  }

  getRemainingVinsForOrder(orderId: number): Observable<RemainingVinCandidate[]> {
    return this.http.get<RemainingVinCandidate[]>(`${this.baseUrl}/orders/${orderId}/remaining-vins`);
  }

  processBatch(dto: ProcessBatchDto): Observable<CorporateBatchResult> {
    return this.http.post<CorporateBatchResult>(`${this.baseUrl}/process-batch`, dto);
  }

  // ==================== Delivery Notes ====================

  getDeliveryNotes(): Observable<DeliveryNoteResult[]> {
    return this.http.get<DeliveryNoteResult[]>(`${this.baseUrl}/deliveries`);
  }

  getDeliveryNoteById(id: number): Observable<DeliveryNoteResult> {
    return this.http.get<DeliveryNoteResult>(`${this.baseUrl}/deliveries/${id}`);
  }
}
