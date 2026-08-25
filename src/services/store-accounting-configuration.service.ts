import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../environments/environment';
import {
  StoreAccountingConfiguration,
  CreateStoreAccountingConfigurationDto,
  UpdateStoreAccountingConfigurationDto
} from '../models/store-accounting-configuration.model';

@Injectable({
  providedIn: 'root'
})
export class StoreAccountingConfigurationService {
  private readonly baseUrl = `${environment.origin}api/StoreAccountingConfigurations`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StoreAccountingConfiguration[]> {
    return this.http.get<StoreAccountingConfiguration[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<StoreAccountingConfiguration> {
    return this.http.get<StoreAccountingConfiguration>(`${this.baseUrl}/${id}`);
  }

  getByStoreId(storeId: number): Observable<StoreAccountingConfiguration> {
    return this.http.get<StoreAccountingConfiguration>(`${this.baseUrl}/ByStore/${storeId}`);
  }

  /** True only when the store has a configuration row AND it's active -- a 404 (never
   *  configured) and a present-but-inactive row both mean "cannot post", matching how
   *  JournalEngineService/AccountResolutionService treat `config == null || !config.IsActive`
   *  server-side. Never throws -- any error (404 included) resolves to false so callers can
   *  bind this directly to a warning check. */
  isConfigured(storeId: number): Observable<boolean> {
    return this.getByStoreId(storeId).pipe(
      map((config) => !!config?.isActive),
      catchError(() => of(false))
    );
  }

  create(dto: CreateStoreAccountingConfigurationDto): Observable<StoreAccountingConfiguration> {
    return this.http.post<StoreAccountingConfiguration>(`${this.baseUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateStoreAccountingConfigurationDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
