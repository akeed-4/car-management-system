import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  PoDto,
  CreatePoDto,
  UpdatePoDto,
  ApprovedQuotationLookupDto,
  QuotationItemForPODto
} from '../models/purchase-order.model';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private apiUrl = environment.origin + 'api/PurchaseOrders';
  private supplierRfqsApiUrl = environment.origin + 'api/SupplierRfqs';

  constructor(private http: HttpClient) { }

  getAll(): Observable<PoDto[]> {
    return this.http.get<PoDto[]>(`${this.apiUrl}/GetAll`);
  }

  getById(id: number): Observable<PoDto> {
    return this.http.get<PoDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreatePoDto): Observable<PoDto> {
    return this.http.post<PoDto>(`${this.apiUrl}/Create`, dto);
  }

  update(id: number, dto: UpdatePoDto): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  /** Cascading dropdown: approved quotations with remaining un-ordered lines, for the given vendor. */
  getQuotationsByVendor(vendorId: number): Observable<ApprovedQuotationLookupDto[]> {
    return this.http.get<ApprovedQuotationLookupDto[]>(`${this.supplierRfqsApiUrl}/GetQuotationsByVendor/${vendorId}`);
  }

  /** Auto-populates the PO grid once a quotation is selected. */
  getItemsForPO(supplierRfqId: number): Observable<QuotationItemForPODto[]> {
    return this.http.get<QuotationItemForPODto[]>(`${this.supplierRfqsApiUrl}/${supplierRfqId}/GetItemsForPO`);
  }
}
