import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  PurchaseAdditionalCost,
  CreatePurchaseAdditionalCostDto,
  UpdatePurchaseAdditionalCostDto,
  AllocationPreview,
  AdditionalCostsByCategoryRow,
} from '../models/purchase-additional-cost.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class PurchaseAdditionalCostService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/PurchaseAdditionalCosts';

  getAll(): Observable<ApiResponse<PurchaseAdditionalCost[]>> {
    return this.http.get<ApiResponse<PurchaseAdditionalCost[]>>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<ApiResponse<PurchaseAdditionalCost>> {
    return this.http.get<ApiResponse<PurchaseAdditionalCost>>(`${this.apiUrl}/GetById/${id}`);
  }

  /** Live preview for Quantity/Cost/Weight (no manual lines needed). */
  previewAllocation(purchaseInvoiceId: number, allocationMethod: string, amount: number): Observable<ApiResponse<AllocationPreview>> {
    const params = new HttpParams()
      .set('purchaseInvoiceId', purchaseInvoiceId)
      .set('allocationMethod', allocationMethod)
      .set('amount', amount);
    return this.http.get<ApiResponse<AllocationPreview>>(`${this.apiUrl}/PreviewAllocation`, { params });
  }

  /** Live preview for Manual allocation (validates the entered lines sum to amount). */
  previewManualAllocation(dto: CreatePurchaseAdditionalCostDto): Observable<ApiResponse<AllocationPreview>> {
    return this.http.post<ApiResponse<AllocationPreview>>(`${this.apiUrl}/PreviewManualAllocation`, dto);
  }

  create(dto: CreatePurchaseAdditionalCostDto): Observable<ApiResponse<PurchaseAdditionalCost>> {
    return this.http.post<ApiResponse<PurchaseAdditionalCost>>(`${this.apiUrl}/Create`, dto);
  }

  /** Draft only -- backend rejects once Posted. */
  update(id: number, dto: UpdatePurchaseAdditionalCostDto): Observable<ApiResponse<PurchaseAdditionalCost>> {
    return this.http.put<ApiResponse<PurchaseAdditionalCost>>(`${this.apiUrl}/Update/${id}`, dto);
  }

  /** Draft only -- backend rejects once Posted. */
  delete(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/Delete/${id}`);
  }

  /** Freezes the document: writes CarCost rows, updates Car.TotalCost, posts the journal entry. */
  post(id: number, postedBy: number): Observable<ApiResponse<PurchaseAdditionalCost>> {
    return this.http.post<ApiResponse<PurchaseAdditionalCost>>(`${this.apiUrl}/${id}/post?postedBy=${postedBy}`, {});
  }

  /** Reverses a Posted document. */
  cancel(id: number, cancelledBy: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/cancel?cancelledBy=${cancelledBy}`, {});
  }

  getByCategoryReport(from?: string, to?: string): Observable<ApiResponse<AdditionalCostsByCategoryRow[]>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<ApiResponse<AdditionalCostsByCategoryRow[]>>(`${this.apiUrl}/reports/by-category`, { params });
  }
}
