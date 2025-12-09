import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Customer } from '../types/customer.model';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = 'http://localhost:5294/api/customers';

  private customers = signal<Customer[]>([]);
  public customers$ = this.customers.asReadonly();

  constructor(private http: HttpClient) {
    this.loadCustomers();
  }

  /** Load customers from API */
  loadCustomers() {
    this.http.get<Customer[]>(this.apiUrl)
      .pipe(
        tap(data => this.customers.set(data))
      )
      .subscribe();
  }

  /** Get customer by ID */
  getCustomerById(id: number): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }

  /** Add new customer */
  addCustomer(customer: Omit<Customer, 'id'>) {
    this.http.post<Customer>(this.apiUrl, customer)
      .pipe(
        tap(newCustomer => {
          this.customers.update(c => [...c, newCustomer]);
        })
      )
      .subscribe();
  }

  /** Update customer */
  updateCustomer(customer: Customer) {
    this.http.put<Customer>(`${this.apiUrl}/${customer.id}`, customer)
      .pipe(
        tap(updated => {
          this.customers.update(c =>
            c.map(x => x.id === updated.id ? updated : x)
          );
        })
      )
      .subscribe();
  }

  /** Delete customer */
  deleteCustomer(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          this.customers.update(c => c.filter(x => x.id !== id));
        })
      )
      .subscribe();
  }
}
