import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CurrencyExchangeRate, CreateExchangeRateDto, UpdateExchangeRateDto } from '../models/exchange-rate.model';

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private readonly baseUrl = `${environment.origin}api/CurrencyExchangeRates`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CurrencyExchangeRate[]> {
    return this.http.get<CurrencyExchangeRate[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<CurrencyExchangeRate> {
    return this.http.get<CurrencyExchangeRate>(`${this.baseUrl}/${id}`);
  }

  /** Resolves the rate a document dated asOfDate should use for this currency pair. Returns null
   * (via HTTP 204) when no rate is configured yet for the pair as of that date. */
  getApplicable(fromCurrencyId: number, toCurrencyId: number, asOfDate: string): Observable<CurrencyExchangeRate | null> {
    return this.http.get<CurrencyExchangeRate | null>(`${this.baseUrl}/Applicable`, {
      params: { fromCurrencyId, toCurrencyId, asOfDate }
    });
  }

  create(dto: CreateExchangeRateDto): Observable<CurrencyExchangeRate> {
    return this.http.post<CurrencyExchangeRate>(`${this.baseUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateExchangeRateDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
