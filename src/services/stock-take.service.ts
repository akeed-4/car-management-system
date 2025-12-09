import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockTake } from '../types/stock-take.model';

@Injectable({
  providedIn: 'root',
})
export class StockTakeService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/stock-takes'; // رابط الـ API الحقيقي

  constructor() {}

  // جلب كل StockTakes
  getStockTakes(): Observable<StockTake[]> {
    return this.http.get<StockTake[]>(this.apiUrl);
  }

  // جلب StockTake واحدة حسب ID
  getStockTakeById(id: number): Observable<StockTake> {
    return this.http.get<StockTake>(`${this.apiUrl}/${id}`);
  }

  // إضافة StockTake جديدة
  addStockTake(stockTake: Omit<StockTake, 'id' | 'status'>): Observable<StockTake> {
    const newStockTake = { ...stockTake, status: 'Pending' };
    return this.http.post<StockTake>(this.apiUrl, newStockTake);
  }

  // تحديث StockTake
  updateStockTake(stockTake: StockTake): Observable<StockTake> {
    return this.http.put<StockTake>(`${this.apiUrl}/${stockTake.id}`, stockTake);
  }

  // تحديث حالة StockTake
  updateStockTakeStatus(id: number, status: 'Pending' | 'Approved'): Observable<StockTake> {
    return this.http.patch<StockTake>(`${this.apiUrl}/${id}`, { status });
  }

  // حذف StockTake
  deleteStockTake(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
