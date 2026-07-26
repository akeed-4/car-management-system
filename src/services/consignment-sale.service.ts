import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ConsignmentSale, CreateConsignmentSaleDto } from '../models/consignment-sale.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DxLoadResult<T> {
  data: T[];
  totalCount: number;
  groupCount?: number;
  summary?: unknown[];
}

@Injectable({
  providedIn: 'root',
})
export class ConsignmentSaleService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/ConsignmentSales';

  loadDataGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<ConsignmentSale>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<ConsignmentSale>>(`${this.apiUrl}/GetAll`, { params });
  }

  getById(id: number): Observable<ApiResponse<ConsignmentSale>> {
    return this.http.get<ApiResponse<ConsignmentSale>>(`${this.apiUrl}/${id}`);
  }

  /** Sells a consignment vehicle: posts the commission journal entry and marks the vehicle Sold. */
  sell(dto: CreateConsignmentSaleDto): Observable<ApiResponse<ConsignmentSale>> {
    return this.http.post<ApiResponse<ConsignmentSale>>(`${this.apiUrl}/Sell`, dto);
  }

  /** Reverses the journal entry and reverts the vehicle to Available. */
  cancel(id: number, cancelledBy: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/cancel?cancelledBy=${cancelledBy}`, {});
  }

  /** Same reversal as cancel, but the vehicle is marked Returned (to the owner) instead of Available. */
  return(id: number, cancelledBy: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/${id}/return?cancelledBy=${cancelledBy}`, {});
  }
}
