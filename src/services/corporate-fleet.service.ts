import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CorporateQuotation, CreateCorporateQuotationDto } from '../models/corporate/corporate-quotation.model';
import { CorporateOrder, CreateCorporateOrderDto } from '../models/corporate/corporate-order.model';
import {
  CreateCorporateInvoiceFromDeliveryDto,
  CreateCorporateInvoiceFromQuotationDto,
  DeliveryNoteResult,
  DispatchBatchDto,
  OrderFulfillmentProgress,
  RemainingVinCandidate
} from '../models/corporate/corporate-dispatch.model';
import { UninvoicedDeliveryLookup } from '../models/sales/uninvoiced-delivery.model';
import { SalesInvoice } from '../models/sales-invoice.model';

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
  private readonly baseUrl = `${environment.origin}api/CorporateSales`;

  constructor(private http: HttpClient) {}

  // ==================== Quotations ====================

  createQuotation(dto: CreateCorporateQuotationDto): Observable<CorporateQuotation> {
    return this.http.post<CorporateQuotation>(`${this.baseUrl}/CreateQuotation`, dto);
  }

  getQuotationById(id: number): Observable<CorporateQuotation> {
    return this.http.get<CorporateQuotation>(`${this.baseUrl}/GetQuotationById/${id}`);
  }

  getSubmittedQuotations(): Observable<CorporateQuotation[]> {
    return this.http.get<CorporateQuotation[]>(`${this.baseUrl}/GetSubmittedQuotations`, {
      params: { status: 'Approved' }
    });
  }

  getAllQuotations(): Observable<CorporateQuotation[]> {
    return this.http.get<CorporateQuotation[]>(`${this.baseUrl}/GetSubmittedQuotations`);
  }

  getCreditSummary(customerId: number): Observable<CreditSummary> {
    debugger
    return this.http.get<CreditSummary>(`${this.baseUrl}/customers/${customerId}/creditsSummary`);
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

  dispatchBatch(dto: DispatchBatchDto): Observable<DeliveryNoteResult[]> {
    return this.http.post<DeliveryNoteResult[]>(`${this.baseUrl}/dispatch`, dto);
  }

  // ==================== Delivery Notes ====================

  getDeliveryNotes(): Observable<DeliveryNoteResult[]> {
    return this.http.get<DeliveryNoteResult[]>(`${this.baseUrl}/deliveries`);
  }

  getDeliveryNoteById(id: number): Observable<DeliveryNoteResult> {
    return this.http.get<DeliveryNoteResult>(`${this.baseUrl}/deliveries/${id}`);
  }

  getUninvoicedDeliveries(): Observable<UninvoicedDeliveryLookup[]> {
    return this.http.get<UninvoicedDeliveryLookup[]>(`${this.baseUrl}/deliveries/uninvoiced`);
  }

  // ==================== Flexible Invoicing ====================

  createInvoiceFromQuotation(dto: CreateCorporateInvoiceFromQuotationDto): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.baseUrl}/invoices/from-quotation`, dto);
  }

  createInvoiceFromDelivery(dto: CreateCorporateInvoiceFromDeliveryDto): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(`${this.baseUrl}/invoices/from-delivery`, dto);
  }
}
