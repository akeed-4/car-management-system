import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CorporateClient, CorporateQuotation, CreateCorporateQuotationDto } from '../models/corporate/corporate-quotation.model';
import { CorporateOrder, CreateCorporateOrderDto } from '../models/corporate/corporate-order.model';
import { CorporateBatchDispatch, OrderFulfillmentProgress, ProcessBatchDto, RemainingVinCandidate } from '../models/corporate/corporate-dispatch.model';

@Injectable({
  providedIn: 'root'
})
export class CorporateFleetService {
  private readonly baseUrl = `${environment.origin}api/corporate`;

  constructor(private http: HttpClient) {}

  // ==================== Quotations ====================

  getCorporateClients(): Observable<CorporateClient[]> {
    return this.http.get<CorporateClient[]>(`${this.baseUrl}/clients`);
  }

  getCorporateClientById(clientId: number): Observable<CorporateClient> {
    return this.http.get<CorporateClient>(`${this.baseUrl}/clients/${clientId}`);
  }

  createQuotation(dto: CreateCorporateQuotationDto): Observable<CorporateQuotation> {
    return this.http.post<CorporateQuotation>(`${this.baseUrl}/quotations`, dto);
  }

  getQuotationById(id: number): Observable<CorporateQuotation> {
    return this.http.get<CorporateQuotation>(`${this.baseUrl}/quotations/${id}`);
  }

  getSubmittedQuotations(): Observable<CorporateQuotation[]> {
    return this.http.get<CorporateQuotation[]>(`${this.baseUrl}/quotations`, {
      params: { status: 'Submitted' }
    });
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

  // ==================== Batch Dispatch ====================

  getFulfillmentProgress(orderId: number): Observable<OrderFulfillmentProgress> {
    return this.http.get<OrderFulfillmentProgress>(`${this.baseUrl}/orders/${orderId}/fulfillment`);
  }

  getRemainingVinsForOrder(orderId: number): Observable<RemainingVinCandidate[]> {
    return this.http.get<RemainingVinCandidate[]>(`${this.baseUrl}/orders/${orderId}/remaining-vins`);
  }

  processBatch(dto: ProcessBatchDto): Observable<CorporateBatchDispatch> {
    return this.http.post<CorporateBatchDispatch>(`${this.baseUrl}/process-batch`, dto);
  }
}
