import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { InventoryClosingPeriod, CloseInventoryPeriodDto } from '../models/inventory-closing-period.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryClosingPeriodService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/InventoryClosingPeriods';

  getByStoreId(storeId: number): Observable<ApiResponse<InventoryClosingPeriod[]>> {
    return this.http.get<ApiResponse<InventoryClosingPeriod[]>>(`${this.apiUrl}/ByStore/${storeId}`);
  }

  close(dto: CloseInventoryPeriodDto, createdBy: number): Observable<ApiResponse<InventoryClosingPeriod>> {
    return this.http.post<ApiResponse<InventoryClosingPeriod>>(`${this.apiUrl}/Close?createdBy=${createdBy}`, dto);
  }
}
