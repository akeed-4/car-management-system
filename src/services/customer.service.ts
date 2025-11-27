import { Injectable, signal } from '@angular/core';
import { Customer } from '../types/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private nextId = signal(4);
  private customers = signal<Customer[]>([
    { id: 1, name: 'عبدالله محمد', nationalId: '1098765432', phone: '0501234567', address: 'الرياض, حي الملز' },
    { id: 2, name: 'فاطمة خالد', nationalId: '2087654321', phone: '0557654321', address: 'جدة, حي السلامة' },
    { id: 3, name: 'John Smith', nationalId: '2456789123', phone: '0539876543', address: 'الدمام, حي الشاطئ' },
  ]);

  public customers$ = this.customers.asReadonly();

  getCustomerById(id: number): Customer | undefined {
    return this.customers().find(c => c.id === id);
  }

  addCustomer(customer: Omit<Customer, 'id'>) {
    const newCustomer: Customer = {
      ...customer,
      id: this.nextId(),
    };
    this.customers.update(customers => [...customers, newCustomer]);
    this.nextId.update(id => id + 1);
  }
  
  updateCustomer(updatedCustomer: Customer) {
    this.customers.update(customers => 
      customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c)
    );
  }

  deleteCustomer(id: number) {
    this.customers.update(customers => customers.filter(c => c.id !== id));
  }
}