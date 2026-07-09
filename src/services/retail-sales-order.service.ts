import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  RetailSalesOrderDto,
  CreateRetailSalesOrderRequest,
  UpdateRetailSalesOrderDto,
  PendingRetailQuotationLookupDto
} from '../models/retail-sales-order.model';

@Injectable({
  providedIn: 'root'
})
export class RetailSalesOrderService {
  private apiUrl = environment.origin + 'api/RetailSalesOrders';

  constructor(private http: HttpClient) { }

  getAll(): Observable<RetailSalesOrderDto[]> {
    return this.http.get<RetailSalesOrderDto[]>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<RetailSalesOrderDto> {
    return this.http.get<RetailSalesOrderDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateRetailSalesOrderRequest): Observable<RetailSalesOrderDto> {
    return this.http.post<RetailSalesOrderDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateRetailSalesOrderDto): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  submit(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/submit`, {});
  }

  approve(id: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/approve`, {});
  }

  reject(id: number, rejectionReason?: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${id}/reject`, { rejectionReason: rejectionReason ?? null });
  }

  getPendingQuotations(): Observable<PendingRetailQuotationLookupDto[]> {
    return this.http.get<PendingRetailQuotationLookupDto[]>(`${this.apiUrl}/GetPendingQuotations`);
  }
}
