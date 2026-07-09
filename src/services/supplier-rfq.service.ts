import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  SupplierRfqDto,
  CreateSupplierRfqDto,
  UpdateSupplierRfqDto,
  PendingRequisitionLookupDto,
  RequisitionItemForQuoteDto
} from '../models/supplier-rfq.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierRfqService {
  private apiUrl = environment.origin + 'api/SupplierRfqs';
  private purchaseRequisitionsApiUrl = environment.origin + 'api/PurchaseRequisitions';

  constructor(private http: HttpClient) { }

  getAll(): Observable<SupplierRfqDto[]> {
    return this.http.get<SupplierRfqDto[]>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<SupplierRfqDto> {
    return this.http.get<SupplierRfqDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateSupplierRfqDto): Observable<SupplierRfqDto> {
    return this.http.post<SupplierRfqDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateSupplierRfqDto): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  approve(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/reject`, {});
  }

  /** Cascading dropdown: pending Purchase Requisitions eligible for quoting by the given vendor. */
  getPendingRequisitionsByVendor(vendorId: number): Observable<PendingRequisitionLookupDto[]> {
    return this.http.get<PendingRequisitionLookupDto[]>(`${this.purchaseRequisitionsApiUrl}/GetPendingPRsByVendor/${vendorId}`);
  }

  /** Auto-populates the quotation grid once a Purchase Requisition is selected. */
  getItemsForQuote(purchaseRequisitionId: number): Observable<RequisitionItemForQuoteDto[]> {
    return this.http.get<RequisitionItemForQuoteDto[]>(`${this.purchaseRequisitionsApiUrl}/${purchaseRequisitionId}/GetItemsForQuote`);
  }
}
