import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceOrder } from '../types/service-order.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/service-orders'; // ضع رابط API الحقيقي هنا

  constructor() {}

  // جلب جميع أوامر الخدمة
  getServiceOrders(): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(this.apiUrl);
  }

  // جلب أمر خدمة حسب ID
  getServiceOrderById(id: number): Observable<ServiceOrder> {
    return this.http.get<ServiceOrder>(`${this.apiUrl}/${id}`);
  }

  // إضافة أمر خدمة جديد
  addServiceOrder(order: Omit<ServiceOrder, 'id'>): Observable<ServiceOrder> {
    const newOrder = {
      ...order,
      status: order.status || 'Pending', // قيمة افتراضية للحالة
    };
    return this.http.post<ServiceOrder>(this.apiUrl, newOrder);
  }

  // تحديث أمر خدمة موجود
  updateServiceOrder(order: ServiceOrder): Observable<ServiceOrder> {
    return this.http.put<ServiceOrder>(`${this.apiUrl}/${order.id}`, order);
  }

  // أرشفة أمر الخدمة
  archiveServiceOrder(id: number): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.apiUrl}/${id}/archive`, {});
  }

  // إلغاء أرشفة أمر الخدمة
  unarchiveServiceOrder(id: number): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(`${this.apiUrl}/${id}/unarchive`, {});
  }

  // تحديث حالة السيارة في المخزون مرتبط بأمر الخدمة
  updateCarStatus(carId: number, status: string): Observable<any> {
    const url = `https://api.example.com/inventory/cars/${carId}/status`;
    return this.http.patch(url, { status });
  }

  // إنشاء مصروف مرتبط بأمر الخدمة (اختياري)
  addExpense(expense: any): Observable<any> {
    return this.http.post('https://api.example.com/expenses', expense);
  }
}
