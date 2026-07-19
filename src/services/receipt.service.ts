import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Receipt, CreateReceiptDto } from '../models/receipt.model';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * Matches carSystemBackend's ReceiptsController exactly (Application/DTOs/ReceiptDto.cs,
 * Controllers/ReceiptsController.cs) - one Receipt per customer/invoice, with ReceiptDetails as
 * the per-car cost breakdown, not a multi-invoice allocation batch.
 */
@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/Receipts';

  receipts$ = this.getReceipts();

  constructor() {}

  getReceipts(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.apiUrl}/GetAll`);
  }

  getReceiptById(id: number): Observable<Receipt> {
    return this.http.get<Receipt>(`${this.apiUrl}/GetById/${id}`);
  }

  addReceipt(receipt: CreateReceiptDto): Observable<Receipt> {
    return this.http.post<Receipt>(`${this.apiUrl}/Create`, receipt);
  }

  updateReceipt(receipt: Partial<CreateReceiptDto>, receiptId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Update/${receiptId}`, receipt);
  }

  deleteReceipt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}
