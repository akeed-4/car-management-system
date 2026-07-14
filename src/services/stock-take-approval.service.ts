import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockTakeApproval } from '../models/stock-take-approval.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockTakeApprovalService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/stockTakes'; // رابط الـ API الحقيقي

  constructor() {}

  // جلب كل الموافقات
  getApprovals(): Observable<StockTakeApproval[]> {
    return this.http.get<StockTakeApproval[]>(this.apiUrl + '/GetAll');
  }

  // جلب موافقة واحدة حسب ID
  getApprovalById(id: number): Observable<StockTakeApproval> {
    return this.http.get<StockTakeApproval>(`${this.apiUrl}/GetById/${id}`);
  }

  // إضافة موافقة جديدة
  addApproval(approval: Omit<StockTakeApproval, 'id'>): Observable<StockTakeApproval> {
    return this.http.post<StockTakeApproval>(`${this.apiUrl}/CreateApproval`, approval);
  }

  // تحديث موافقة موجودة
  updateApproval(approval: StockTakeApproval): Observable<StockTakeApproval> {
    return this.http.put<StockTakeApproval>(`${this.apiUrl}/${approval.id}`, approval);
  }

  // حذف موافقة
  deleteApproval(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
