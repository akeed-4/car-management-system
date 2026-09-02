import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Customer } from '../models/customer.model';
import { tap } from 'rxjs';
import { environment } from '../environments/environment';
import { PotentialLinkedParty } from '../models/potential-linked-party.model';
@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl =environment.origin + 'api/Customers';

  private customers = signal<Customer[]>([]);
  public customers$ = this.customers.asReadonly();

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  /** Load customers from API */
  loadCustomers() {
    this.http.get<Customer[]>(this.apiUrl + '/GetAll').subscribe({
      next: (data) => {
        this.customers.set(data);
        console.log('Customers loaded', data);
      },
      error: (error) => {
        console.error('Failed to load customers', error);
      }
    });
  }

  /** Get customer by ID */
  getCustomerById(id: number): Promise<Customer> {
   return firstValueFrom(this.http.get<Customer>(`${this.apiUrl}/GetById/${id}`));
  }

  /** Proactive check reused by credit invoice/receipt forms before save: does this customer
   *  already have a usable Accounts Receivable account? Backed by the same
   *  AccountResolutionService.ResolveReceivableAccountAsync the backend enforces at save time, so
   *  this can never say "yes" when the real save would still reject it. */
  hasReceivableAccount(customerId: number): Observable<{ hasAccount: boolean }> {
    return this.http.get<{ hasAccount: boolean }>(`${this.apiUrl}/${customerId}/receivable-account-status`);
  }

  /** Advisory duplicate-detection lookup: does a Supplier already exist with this phone number
   *  (and not yet linked to another customer)? Never rejects -- returns null when there's no
   *  match, so the caller can offer "link as the same party?" without blocking the form. */
  findPotentialSupplierMatch(phone: string): Observable<PotentialLinkedParty | null> {
    return this.http.get<PotentialLinkedParty | null>(`${this.apiUrl}/potential-supplier-match`, { params: { phone } });
  }

  /** Add new customer */
  addCustomer(customer: Omit<Customer, 'id'>): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl+'/Create', customer)
      .pipe(
        tap(newCustomer => {
          this.customers.update(c => [...c, newCustomer]);
        })
      );
  }

  /** Update customer. Always sends updateLinkedSupplier:true -- the form always carries the
   *  current linkedSupplierId (possibly null/unchanged), so the backend's "only touch the link
   *  when this flag is set" opt-in is satisfied every time a full customer object is saved here. */
  updateCustomer(customer: Customer): Observable<Customer> {
    const payload = { ...customer, updateLinkedSupplier: true };
    return this.http.put<Customer>(`${this.apiUrl}/Update/${customer.id}`, payload)
      .pipe(
        tap(updated => {
          this.customers.update(c =>
            c.map(x => x.id === updated.id ? updated : x)
          );
        })
      );
  }

  /** Delete customer */
  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.customers.update(c => c.filter(x => x.id !== id));
        })
      );
  }
}
