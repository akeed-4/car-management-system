import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CarReceipt, CreateCarReceiptDto } from '../models/car-receipt.model';
import { CreatePurchaseOfferDto, PurchaseOfferDto, PurchaseOfferStatus } from '../models/purchase-offer.model';
import { CreatePurchaseRequestDto, PurchaseRequestDto, PurchaseRequestStatus } from '../models/purchase-request.model';
import { CreatePoDto, PoDto } from '../models/purchase-order.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PurchaseCycleService {
  private purchaseOffersApiUrl = environment.origin + 'api/PurchaseOffers';
  private purchaseRequestsApiUrl = environment.origin + 'api/PurchaseRequests';
  private purchaseOrdersApiUrl = environment.origin + 'api/PurchaseOrders';
  private carReceiptsApiUrl = environment.origin + 'api/CarReceipts';

  constructor(private http: HttpClient) { }

  // ===================================================================
  // PurchaseOffer (Supplier Quotation) -- origin of the chain
  // ===================================================================
  getPurchaseOffers(): Observable<PurchaseOfferDto[]> {
    return this.http.get<PurchaseOfferDto[]>(`${this.purchaseOffersApiUrl}/GetAll`);
  }

  getPurchaseOffer(id: number): Observable<PurchaseOfferDto> {
    return this.http.get<PurchaseOfferDto>(`${this.purchaseOffersApiUrl}/GetById/${id}`);
  }

  createPurchaseOffer(offer: CreatePurchaseOfferDto): Observable<PurchaseOfferDto> {
    return this.http.post<PurchaseOfferDto>(`${this.purchaseOffersApiUrl}/Create`, offer);
  }

  updatePurchaseOffer(id: number, offer: CreatePurchaseOfferDto): Observable<PurchaseOfferDto> {
    return this.http.put<PurchaseOfferDto>(`${this.purchaseOffersApiUrl}/Update/${id}`, offer);
  }

  updatePurchaseOfferStatus(id: number, status: PurchaseOfferStatus): Observable<PurchaseOfferDto> {
    return this.http.patch<PurchaseOfferDto>(`${this.purchaseOffersApiUrl}/UpdateStatus/${id}`, { status });
  }

  /** Accepted offers not yet converted into a Purchase Request -- feeds the Purchase Request screen's dropdown. */
  getEligibleOffersForRequest(): Observable<PurchaseOfferDto[]> {
    return this.http.get<PurchaseOfferDto[]>(`${this.purchaseOffersApiUrl}/GetEligibleForRequest`);
  }

  // ===================================================================
  // Purchase Request (Requisition) -- created FROM an accepted Offer
  // ===================================================================
  getPurchaseRequests(): Observable<PurchaseRequestDto[]> {
    return this.http.get<PurchaseRequestDto[]>(`${this.purchaseRequestsApiUrl}/GetAll`);
  }

  getPurchaseRequest(id: number): Observable<PurchaseRequestDto> {
    return this.http.get<PurchaseRequestDto>(`${this.purchaseRequestsApiUrl}/GetById/${id}`);
  }

  createPurchaseRequest(request: CreatePurchaseRequestDto): Observable<PurchaseRequestDto> {
    return this.http.post<PurchaseRequestDto>(`${this.purchaseRequestsApiUrl}/Create`, request);
  }

  updatePurchaseRequest(id: number, request: CreatePurchaseRequestDto): Observable<PurchaseRequestDto> {
    return this.http.put<PurchaseRequestDto>(`${this.purchaseRequestsApiUrl}/Update/${id}`, request);
  }

  updatePurchaseRequestStatus(id: number, status: PurchaseRequestStatus): Observable<PurchaseRequestDto> {
    return this.http.patch<PurchaseRequestDto>(`${this.purchaseRequestsApiUrl}/UpdateStatus/${id}`, { status });
  }

  /** Approved requests not yet converted into a PO -- feeds the Purchase Order screen's dropdown. */
  getEligibleRequestsForPo(): Observable<PurchaseRequestDto[]> {
    return this.http.get<PurchaseRequestDto[]>(`${this.purchaseRequestsApiUrl}/GetEligibleForPo`);
  }

  // ===================================================================
  // Purchase Order -- created FROM an approved Request
  // ===================================================================
  getPurchaseOrders(): Observable<PoDto[]> {
    return this.http.get<PoDto[]>(`${this.purchaseOrdersApiUrl}/GetAll`);
  }

  getPurchaseOrder(id: number): Observable<PoDto> {
    return this.http.get<PoDto>(`${this.purchaseOrdersApiUrl}/GetById/${id}`);
  }

  createPurchaseOrder(po: CreatePoDto): Observable<PoDto> {
    return this.http.post<PoDto>(`${this.purchaseOrdersApiUrl}/Create`, po);
  }

  updatePurchaseOrder(id: number, po: CreatePoDto): Observable<PoDto> {
    return this.http.put<PoDto>(`${this.purchaseOrdersApiUrl}/Update/${id}`, po);
  }

  /** Open or PartiallyReceived POs -- feeds the GRN screen's dropdown. Fully-received POs never appear. */
  getOpenPurchaseOrders(): Observable<PoDto[]> {
    return this.http.get<PoDto[]>(`${this.purchaseOrdersApiUrl}/GetOpen`);
  }

  // ===================================================================
  // CarReceipt (GRN) -- created FROM an open PO, supports partial receiving
  // ===================================================================
  getCarReceipts(): Observable<CarReceipt[]> {
    return this.http.get<CarReceipt[]>(`${this.carReceiptsApiUrl}/GetAll`);
  }

  getCarReceipt(id: number): Observable<CarReceipt> {
    return this.http.get<CarReceipt>(`${this.carReceiptsApiUrl}/GetById/${id}`);
  }

  createCarReceipt(receipt: CreateCarReceiptDto): Observable<CarReceipt> {
    return this.http.post<CarReceipt>(`${this.carReceiptsApiUrl}/Create`, receipt);
  }

  updateCarReceipt(id: number, receipt: Partial<CarReceipt>): Observable<CarReceipt> {
    return this.http.put<CarReceipt>(`${this.carReceiptsApiUrl}/Update/${id}`, receipt);
  }

  /** Un-invoiced GRNs across all suppliers -- feeds the Purchase Invoice screen's dropdown. */
  getUninvoicedReceipts(): Observable<CarReceipt[]> {
    return this.http.get<CarReceipt[]>(`${this.carReceiptsApiUrl}/GetUninvoiced`);
  }

  markCarReceiptsInvoiced(receiptIds: number[], invoiceId: number): Observable<void> {
    return this.http.patch<void>(`${this.carReceiptsApiUrl}/MarkInvoiced`, { receiptIds, invoiceId });
  }
}
