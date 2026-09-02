import { Injectable, inject,signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../models/supplier.model';
import { environment } from '../environments/environment';
import { tap } from 'rxjs';
import { PotentialLinkedParty } from '../models/potential-linked-party.model';

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

  /** Proactive check reused by credit invoice/payment forms before save: does this supplier
   *  already have a usable Accounts Payable account? Backed by the same
   *  AccountResolutionService.ResolvePayableAccountAsync the backend enforces at save time, so
   *  this can never say "yes" when the real save would still reject it. */
  hasPayableAccount(supplierId: number): Observable<{ hasAccount: boolean }> {
    return this.http.get<{ hasAccount: boolean }>(`${this.apiUrl}/${supplierId}/payable-account-status`);
  }

  /** Advisory duplicate-detection lookup: does a Customer already exist with this phone number
   *  (and not yet linked to another supplier)? Never rejects -- returns null when there's no
   *  match, so the caller can offer "link as the same party?" without blocking the form. */
  findPotentialCustomerMatch(phone: string): Observable<PotentialLinkedParty | null> {
    return this.http.get<PotentialLinkedParty | null>(`${this.apiUrl}/potential-customer-match`, { params: { phone } });
  }

  // جلب مورد واحد حسب ID
  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/GetById/${id}`);
  }


  addSupplier(supplier: Omit<Supplier, 'id'>): Observable<Supplier> {
    return this.http.post<Supplier>(this.apiUrl+'/Create', supplier)
      .pipe(
        tap(newSupplier => {
          this.suppliers.update(s => [...s, newSupplier]);
        })
      )
  }

  // تحديث مورد موجود -- always sends updateLinkedCustomer:true, mirroring
  // CustomerService.updateCustomer's rationale (the form always carries the current
  // linkedCustomerId, so the backend's opt-in flag is satisfied every time).
  updateSupplier(supplier: Supplier): Observable<Supplier> {
    const payload = { ...supplier, updateLinkedCustomer: true };
    return this.http.put<Supplier>(`${this.apiUrl}/Update/${supplier.id}`, payload);
  }

  // حذف مورد
  deleteSupplier(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Delete/${id}`);
  }
}
