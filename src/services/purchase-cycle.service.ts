import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CarReceipt, CreateCarReceiptDto } from '../models/car-receipt.model';
import { ApprovedOfferLookupDto, CreatePurchaseOfferDto, OfferItemForPODto, PurchaseOfferDto } from '../models/purchase-offer.model';
import { ApprovedRequestLookupDto, CreatePurchaseRequestDto, PurchaseRequestDto } from '../models/purchase-request.model';
import { PoDto } from '../models/purchase-order.model';
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

  approvePurchaseOffer(id: number): Observable<any> {
    return this.http.post<any>(`${this.purchaseOffersApiUrl}/${id}/approve`, {});
  }

  rejectPurchaseOffer(id: number): Observable<any> {
    return this.http.post<any>(`${this.purchaseOffersApiUrl}/${id}/reject`, {});
  }

  /** Approved offers with at least one unconverted line, optionally scoped to a supplier -- feeds the Purchase Order screen's dropdown. */
  getEligibleOffersForPO(supplierId?: number): Observable<ApprovedOfferLookupDto[]> {
    const url = supplierId ? `${this.purchaseOffersApiUrl}/GetEligibleParents?supplierId=${supplierId}` : `${this.purchaseOffersApiUrl}/GetEligibleParents`;
    return this.http.get<any>(url).pipe(map(response => response?.data ?? response));
  }

  /** Auto-populates the PO grid once a purchase offer is selected. */
  getItemsForOffer(offerId: number): Observable<OfferItemForPODto[]> {
    return this.http.get<any>(`${this.purchaseOffersApiUrl}/PopulateFromParent/${offerId}`).pipe(map(response => response?.data ?? response));
  }

  // ===================================================================
  // Purchase Request (Requisition) -- created FROM an accepted Offer
  // ===================================================================
  getPurchaseRequests(): Observable<PurchaseRequestDto[]> {
    return this.http.get<any>(`${this.purchaseRequestsApiUrl}/GetAll`).pipe(map(response => response?.data ?? response));
  }

  getPurchaseRequest(id: number): Observable<PurchaseRequestDto> {
    return this.http.get<any>(`${this.purchaseRequestsApiUrl}/${id}`).pipe(
      map(response => response?.data ?? response)
    );
  }

  createPurchaseRequest(request: CreatePurchaseRequestDto): Observable<PurchaseRequestDto> {
    return this.http.post<any>(`${this.purchaseRequestsApiUrl}/Create`, request).pipe(map(response => response?.data ?? response));
  }

  updatePurchaseRequest(id: number, request: CreatePurchaseRequestDto): Observable<any> {
    return this.http.put<any>(`${this.purchaseRequestsApiUrl}/Update/${id}`, request);
  }

  approvePurchaseRequest(id: number): Observable<any> {
    return this.http.post<any>(`${this.purchaseRequestsApiUrl}/${id}/approve`, {});
  }

  rejectPurchaseRequest(id: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.purchaseRequestsApiUrl}/${id}/reject`, { reason });
  }

  deletePurchaseRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.purchaseRequestsApiUrl}/${id}`);
  }

  /** Approved requests with at least one unconverted line -- feeds the Purchase Order screen's dropdown. */
  getEligibleRequestsForPo(): Observable<ApprovedRequestLookupDto[]> {
    return this.http.get<any>(`${this.purchaseRequestsApiUrl}/GetEligibleParents`).pipe(map(response => response?.data ?? response));
  }

  // ===================================================================
  // Purchase Order (legacy shape) -- kept only for the unreachable legacy
  // car-receipts-form screen. New Purchase Order screens use PurchaseOrderService.
  // ===================================================================
  getPurchaseOrder(id: number): Observable<PoDto> {
    return this.http.get<PoDto>(`${this.purchaseOrdersApiUrl}/GetById/${id}`);
  }

  /** Open or PartiallyReceived POs -- feeds the legacy GRN screen's dropdown. */
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
}
