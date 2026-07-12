import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import {
  RequestedCar,
  CreateRequestedCarDto,
  UpdateRequestedCarDto,
} from '../models/requested-car.model';

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
export class RequestedCarService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/RequestedCars';

  private requestedCars = signal<RequestedCar[]>([]);
  public requestedCars$ = this.requestedCars.asReadonly();

  constructor() {
    this.loadRequestedCars();
  }

  /** Loads the full unpaged list into the requestedCars$ signal, for dashboard/summary consumers. */
  loadRequestedCars(): void {
    this.loadDataGrid({ take: 10000 }).subscribe({
      next: (result) => this.requestedCars.set(result.data),
      error: () => this.requestedCars.set([]),
    });
  }

  loadDataGrid(loadOptions: Record<string, unknown>): Observable<DxLoadResult<RequestedCar>> {
    let params = new HttpParams();
    for (const key of Object.keys(loadOptions)) {
      const value = loadOptions[key];
      if (value !== undefined && value !== null) {
        params = params.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }
    return this.http.get<DxLoadResult<RequestedCar>>(`${this.apiUrl}/GetAll`, { params });
  }

  getById(id: number): Observable<ApiResponse<RequestedCar>> {
    return this.http.get<ApiResponse<RequestedCar>>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRequestedCarDto): Observable<ApiResponse<RequestedCar>> {
    return this.http.post<ApiResponse<RequestedCar>>(this.apiUrl, dto).pipe(
      tap(() => this.loadRequestedCars())
    );
  }

  update(id: number, dto: UpdateRequestedCarDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.loadRequestedCars())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadRequestedCars())
    );
  }

  search(searchTerm: string): Observable<ApiResponse<RequestedCar[]>> {
    return this.http.get<ApiResponse<RequestedCar[]>>(`${this.apiUrl}/search`, {
      params: { searchTerm },
    });
  }
}
