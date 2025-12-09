import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockTakeApproval } from '../types/stock-take-approval.model';

@Injectable({
  providedIn: 'root',
})
export class StockTakeApprovalService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/stock-take-approvals'; // رابط الـ API الحقيقي

  constructor() {}

  // جلب كل الموافقات
  getApprovals(): Observable<StockTakeApproval[]> {
    return this.http.get<StockTakeApproval[]>(this.apiUrl);
  }

  // جلب موافقة واحدة حسب ID
  getApprovalById(id: number): Observable<StockTakeApproval> {
    return this.http.get<StockTakeApproval>(`${this.apiUrl}/${id}`);
  }

  // إضافة موافقة جديدة
  addApproval(approval: Omit<StockTakeApproval, 'id'>): Observable<StockTakeApproval> {
    return this.http.post<StockTakeApproval>(this.apiUrl, approval);
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
