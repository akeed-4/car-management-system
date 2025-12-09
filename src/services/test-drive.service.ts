import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestDrive } from '../types/test-drive.model';

@Injectable({
  providedIn: 'root',
})
export class TestDriveService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/test-drives'; // رابط الـ API الخاص بالحجوزات
  bookings$: any;

  constructor() {}

  // جلب جميع الحجوزات
  getBookings(): Observable<TestDrive[]> {
    return this.http.get<TestDrive[]>(this.apiUrl);
  }

  // جلب حجز واحد حسب ID
  getBookingById(id: number): Observable<TestDrive> {
    return this.http.get<TestDrive>(`${this.apiUrl}/${id}`);
  }

  // إضافة حجز جديد
  addBooking(booking: Omit<TestDrive, 'id'>): Observable<TestDrive> {
    return this.http.post<TestDrive>(this.apiUrl, booking);
  }

  // تحديث حجز موجود
  updateBooking(booking: TestDrive): Observable<TestDrive> {
    return this.http.put<TestDrive>(`${this.apiUrl}/${booking.id}`, booking);
  }

  // حذف حجز (اختياري)
  deleteBooking(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
