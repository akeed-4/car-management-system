import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  CarsReceiptNoteDto,
  CreateCarsReceiptNoteDto,
  ActivePOLookupDto,
  POLineForGRNDto
} from '../models/cars-receipt-note.model';

@Injectable({
  providedIn: 'root'
})
export class CarsReceiptNoteService {
  private apiUrl = environment.origin + 'api/CarReceipts';
  private purchaseOrdersApiUrl = environment.origin + 'api/PurchaseOrders';

  constructor(private http: HttpClient) { }

  getAll(): Observable<CarsReceiptNoteDto[]> {
    return this.http.get<CarsReceiptNoteDto[]>(`${this.apiUrl}/GetAll`);
  }

  /** Posted GRNs across all suppliers with at least one line not yet fully invoiced. */
  getUninvoiced(): Observable<CarsReceiptNoteDto[]> {
    return this.http.get<CarsReceiptNoteDto[]>(`${this.apiUrl}/GetUninvoiced`);
  }

  getById(id: number): Observable<CarsReceiptNoteDto> {
    return this.http.get<CarsReceiptNoteDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateCarsReceiptNoteDto): Observable<CarsReceiptNoteDto> {
    return this.http.post<CarsReceiptNoteDto>(`${this.apiUrl}/Create`, dto);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  /** Open/PartiallyReceived POs -- feeds the GRN screen's dropdown. */
  getActivePOs(): Observable<ActivePOLookupDto[]> {
    return this.http.get<ActivePOLookupDto[]>(`${this.purchaseOrdersApiUrl}/GetActivePOs`);
  }

  /** Auto-populates the GRN grid once a PO is selected: remaining lines to receive. */
  getRemainingPOLines(purchaseOrderId: number): Observable<POLineForGRNDto[]> {
    return this.http.get<POLineForGRNDto[]>(`${this.purchaseOrdersApiUrl}/${purchaseOrderId}/GetRemainingPOLines`);
  }
}
