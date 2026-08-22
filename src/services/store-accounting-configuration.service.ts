import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
