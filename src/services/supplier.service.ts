import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../types/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/suppliers'; // رابط الـ API الحقيقي

  constructor() {}

  // جلب كل الموردين
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl);
  }

  // جلب مورد واحد حسب ID
  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  // إضافة مورد جديد
  addSupplier(supplier: Omit<Supplier, 'id'>): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl, supplier);
  }

  // تحديث مورد موجود
  updateSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${supplier.id}`, supplier);
  }

  // حذف مورد
  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
