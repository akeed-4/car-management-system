import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  DeliverySchedule,
  CreateDeliveryScheduleDto,
  UpdateDeliveryScheduleDto,
} from '../models/delivery.model';

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
export class DeliveryService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/DeliverySchedules';

  loadDataGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<DeliverySchedule>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<DeliverySchedule>>(`${this.apiUrl}/GetAll`, { params });
  }

  getById(id: number): Observable<ApiResponse<DeliverySchedule>> {
    return this.http.get<ApiResponse<DeliverySchedule>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDeliveryScheduleDto): Observable<ApiResponse<DeliverySchedule>> {
    return this.http.post<ApiResponse<DeliverySchedule>>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateDeliveryScheduleDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
