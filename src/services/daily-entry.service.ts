import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  DailyEntry,
  CreateDailyEntryDto,
  UpdateDailyEntryDto,
} from '../models/daily-entry.model';

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
export class DailyEntryService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/DailyEntries';

  loadDataGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<DailyEntry>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<DailyEntry>>(`${this.apiUrl}/GetAll`, { params });
  }

  getById(id: number): Observable<ApiResponse<DailyEntry>> {
    return this.http.get<ApiResponse<DailyEntry>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateDailyEntryDto): Observable<ApiResponse<DailyEntry>> {
    return this.http.post<ApiResponse<DailyEntry>>(this.apiUrl, dto);
  }

  update(id: number, dto: UpdateDailyEntryDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
