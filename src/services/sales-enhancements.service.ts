import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesEnhancement } from '../types/sales-enhancements.model';

@Injectable({
  providedIn: 'root'
})
export class SalesEnhancementsService {

  constructor(private http: HttpClient) { }

  // API contracts for sales enhancements
  updateSalesEnhancement(saleId: number, enhancement: SalesEnhancement): Observable<SalesEnhancement> {
    return this.http.put<SalesEnhancement>(`/api/sales/${saleId}/enhancements`, enhancement);
  }

  linkCarToCustomer(saleId: number, chassisNumber?: string, plateNumber?: string): Observable<any> {
    return this.http.post(`/api/sales/${saleId}/link-car`, { chassisNumber, plateNumber });
  }

  approveContract(saleId: number): Observable<any> {
    return this.http.post(`/api/sales/${saleId}/approve-contract`, {});
  }
}