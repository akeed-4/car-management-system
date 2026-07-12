import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import {
  ConsignmentCar,
  CreateConsignmentCarDto,
  UpdateConsignmentCarDto,
} from '../models/consignment-car.model';

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
export class ConsignmentService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/ConsignmentCars';

  private consignmentCars = signal<ConsignmentCar[]>([]);
  public consignmentCars$ = this.consignmentCars.asReadonly();

  constructor() {
    this.loadAll();
  }

  /** Loads the full unpaged list into the consignmentCars$ signal, for dashboard/report consumers. */
  loadAll(): void {
    this.loadDataGrid({ take: 10000 }).subscribe({
      next: (result) => this.consignmentCars.set(result.data),
      error: () => this.consignmentCars.set([]),
    });
  }

  loadDataGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<ConsignmentCar>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<ConsignmentCar>>(`${this.apiUrl}/GetAll`, { params });
  }

  getById(id: number): Observable<ApiResponse<ConsignmentCar>> {
    return this.http.get<ApiResponse<ConsignmentCar>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateConsignmentCarDto): Observable<ApiResponse<ConsignmentCar>> {
    return this.http.post<ApiResponse<ConsignmentCar>>(this.apiUrl, dto).pipe(
      tap(() => this.loadAll())
    );
  }

  update(id: number, dto: UpdateConsignmentCarDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.loadAll())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAll())
    );
  }
}
