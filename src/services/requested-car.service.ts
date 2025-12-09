import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestedCar } from '../types/requested-car.model';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RequestedCarService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/requested-cars'; // ضع رابط API الحقيقي هنا
  private requestedCars = signal<RequestedCar[]>([]);
  public requestedCars$ = this.requestedCars.asReadonly();

  constructor() {
    this.loadRequestedCars();
  }

  loadRequestedCars() {
    this.getRequestedCars().subscribe(requestedCars => this.requestedCars.set(requestedCars));
  }

  // جلب كل الطلبات
  getRequestedCars(): Observable<RequestedCar[]> {
    return this.http.get<RequestedCar[]>(this.apiUrl);
  }

  // جلب طلب محدد حسب ID
  getRequestById(id: number): Observable<RequestedCar> {
    return this.http.get<RequestedCar>(`${this.apiUrl}/${id}`);
  }

  // إضافة طلب جديد
  addRequest(request: Omit<RequestedCar, 'id'>): Observable<RequestedCar> {
    return this.http.post<RequestedCar>(this.apiUrl, request);
  }

  // تحديث طلب موجود
  updateRequest(updatedRequest: RequestedCar): Observable<RequestedCar> {
    return this.http.put<RequestedCar>(`${this.apiUrl}/${updatedRequest.id}`, updatedRequest);
  }

  // حذف طلب
  deleteRequest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // أرشفة الطلب
  archiveRequest(id: number): Observable<RequestedCar> {
    return this.http.patch<RequestedCar>(`${this.apiUrl}/${id}`, { isArchived: true });
  }

  // إلغاء أرشفة الطلب
  unarchiveRequest(id: number): Observable<RequestedCar> {
    return this.http.patch<RequestedCar>(`${this.apiUrl}/${id}`, { isArchived: false });
  }
}
