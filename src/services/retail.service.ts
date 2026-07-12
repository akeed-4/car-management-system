import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateRetailQuotationDto, RetailQuotation } from '../models/retail/retail-quotation.model';
import { CreateRetailInvoiceDto, RetailInvoice } from '../models/retail/retail-invoice.model';
import { CreateRetailDeliveryDto, RetailDelivery } from '../models/retail/retail-delivery.model';
import { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class RetailService {
  private readonly baseUrl = `${environment.origin}api/retail`;

  constructor(private http: HttpClient) {}

  // ==================== Quotations ====================

  getAvailableCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${environment.origin}api/inventory`, {
      params: { status: 'Available' }
    });
  }

  createQuotation(dto: CreateRetailQuotationDto): Observable<RetailQuotation> {
    return this.http.post<RetailQuotation>(`${this.baseUrl}/quotations`, dto);
  }

  // ==================== Invoices ====================

  createInvoice(dto: CreateRetailInvoiceDto): Observable<RetailInvoice> {
    return this.http.post<RetailInvoice>(`${this.baseUrl}/invoices`, dto);
  }

  // ==================== Deliveries ====================

  createDelivery(dto: CreateRetailDeliveryDto): Observable<RetailDelivery> {
    return this.http.post<RetailDelivery>(`${this.baseUrl}/deliveries`, dto);
  }

  getDeliveryById(id: number): Observable<RetailDelivery> {
    return this.http.get<RetailDelivery>(`${this.baseUrl}/deliveries/${id}`);
  }

  /** salesChannel: 1=Afrad (retail, default), 3=Bunuk (bank financing) */
  getDeliveries(salesChannel?: number): Observable<RetailDelivery[]> {
    return this.http.get<RetailDelivery[]>(`${this.baseUrl}/deliveries`, {
      params: salesChannel ? { salesChannel } : {}
    });
  }
}
