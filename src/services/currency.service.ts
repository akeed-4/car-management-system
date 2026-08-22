import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Currency, CreateCurrencyDto, UpdateCurrencyDto } from '../models/currency.model';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly baseUrl = `${environment.origin}api/Currencies`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Currency[]> {
    return this.http.get<Currency[]>(`${this.baseUrl}/GetAll`);
  }

  /** Active currencies only -- use this (not getAll) for any dropdown that selects a currency
   * for a new transaction, so an inactive currency can never be newly chosen. */
  getActive(): Observable<Currency[]> {
    return this.http.get<Currency[]>(`${this.baseUrl}/Active`);
  }

  getById(id: number): Observable<Currency> {
    return this.http.get<Currency>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCurrencyDto): Observable<Currency> {
    return this.http.post<Currency>(`${this.baseUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateCurrencyDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto);
  }

  /** Deactivates the currency -- the backend never physically deletes a currency. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
