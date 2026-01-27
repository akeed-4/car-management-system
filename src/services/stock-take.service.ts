import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockTake } from '../models/stock-take.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StockTakeService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/Stocks';

  constructor() {}

  // جلب كل StockTakes (اختياري حسب المخزن)
  getStockTakes() {
    const url = `${this.apiUrl}`;
    return this.http.get<StockTake[]>(url);
  }

  // جلب StockTakes حسب المخزن
  getStockTakesByStore(storeId: number): Observable<StockTake[]> {
    const url = `${this.apiUrl}/store/${storeId}`;
    return this.http.get<StockTake[]>(url);
  }

  // جلب StockTake واحدة حسب ID
  getStockTakeById(id: number): Observable<StockTake> {
    return this.http.get<StockTake>(`${this.apiUrl+"/GetStockTakeById"}/${id}`);
  }

  // إضافة StockTake جديدة
  addStockTake(stockTake: Omit<StockTake, 'id'>): Observable<StockTake> {
    // Ensure status exists on the payload (default to Draft if not provided)
    const payload = { ...stockTake, status: (stockTake as any).status || 'Draft' };
    console.log('Creating StockTake with payload:', payload);
    return this.http.post<StockTake>(`${this.apiUrl}/CreateStock`, payload);
  }

  // تحديث StockTake
  updateStockTake(stockTake: StockTake): Observable<StockTake> {
    return this.http.put<StockTake>(`${this.apiUrl}/update/${stockTake.id}`, stockTake);
  }

  // تحديث حالة StockTake
  updateStockTakeStatus(id: number, status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'): Observable<StockTake> {
    return this.http.patch<StockTake>(`${this.apiUrl}/UpdateStockTakeStatus/${id}`, { status });
  }

  // حذف StockTake
  deleteStockTake(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/DeleteStockTake/${id}`);
  }
}
