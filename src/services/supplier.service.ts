import { Injectable, inject,signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../types/supplier.model';
import { environment } from '../environments/environment';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private http = inject(HttpClient);
    private apiUrl = environment.origin+ 'api/Suppliers';


  private suppliers = signal<Supplier[]>([]);
  public suppliers$ = this.suppliers.asReadonly();

  constructor() {
    this.loadSuppliers();
  }

  // تحميل الموردين من API
  loadSuppliers() {
    this.http.get<Supplier[]>(this.apiUrl + '/GetAll').subscribe({
      next: (data) => {
        this.suppliers.set(data);
        console.log('Suppliers loaded', data);
      },
      error: (error) => {
        console.error('Failed to load suppliers', error);
      }
    });
  }

  // جلب كل الموردين
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.apiUrl+'/GetAll');
  }

  // جلب مورد واحد حسب ID
  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }


  addSupplier(supplier: Omit<Supplier, 'id'>) {
    this.http.post<Supplier>(this.apiUrl+'/Create', supplier)
      .pipe(
        tap(newSupplier => {
          this.suppliers.update(s => [...s, newSupplier]);
        })
      )
      .subscribe();
  }

  // تحديث مورد موجود
  updateSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/Update/${supplier.id}`, supplier);
  }

  // حذف مورد
  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`);
  }
}
