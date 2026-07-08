import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { CreateRetailQuotationDto, RetailQuotation } from '../models/retail/retail-quotation.model';
import { CreateRetailInvoiceDto, RetailInvoice } from '../models/retail/retail-invoice.model';
import { CreateRetailDeliveryDto, RetailDelivery, VehicleSpecs } from '../models/retail/retail-delivery.model';
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

  getActiveQuotations(): Observable<RetailQuotation[]> {
    return this.http.get<RetailQuotation[]>(`${this.baseUrl}/quotations`, {
      params: { status: 'Submitted' }
    });
  }

  getQuotationById(id: number): Observable<RetailQuotation> {
    return this.http.get<RetailQuotation>(`${this.baseUrl}/quotations/${id}`);
  }

  // ==================== Invoices ====================

  createInvoice(dto: CreateRetailInvoiceDto): Observable<RetailInvoice> {
    return this.http.post<RetailInvoice>(`${this.baseUrl}/invoices`, dto);
  }

  getInvoiceById(id: number): Observable<RetailInvoice> {
    return this.http.get<RetailInvoice>(`${this.baseUrl}/invoices/${id}`);
  }

  // ==================== Deliveries ====================

  createDelivery(dto: CreateRetailDeliveryDto): Observable<RetailDelivery> {
    return this.http.post<RetailDelivery>(`${this.baseUrl}/deliveries`, dto);
  }

  getInvoicesReadyForDelivery(): Observable<RetailInvoice[]> {
    return this.http.get<RetailInvoice[]>(`${this.baseUrl}/invoices`, {
      params: { status: 'Paid' }
    });
  }

  getVehicleSpecsForInvoice(invoiceId: number): Observable<VehicleSpecs> {
    return this.http.get<VehicleSpecs>(`${this.baseUrl}/invoices/${invoiceId}/vehicle-specs`);
  }
}
