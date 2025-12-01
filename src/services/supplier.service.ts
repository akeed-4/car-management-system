import { Injectable, signal } from '@angular/core';
import { Supplier } from '../types/supplier.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private nextId = signal(4);
  private suppliers = signal<Supplier[]>([
    { id: 1, name: 'شركة النهدي للسيارات', crNumber: '4030123456', phone: '011-555-1212', address: 'الرياض, مخرج 5' },
    { id: 2, name: 'مزاد السيارات الدولي', crNumber: '4030654321', phone: '012-555-8989', address: 'جدة, المنطقة الصناعية' },
    { id: 3, name: 'مورد فردي - أحمد علي', crNumber: 'N/A', phone: '0509871234', address: 'الخبر, حي العليا' },
  ]);

  public suppliers$ = this.suppliers.asReadonly();
  
  getSupplierById(id: number): Supplier | undefined {
    return this.suppliers().find(s => s.id === id);
  }

  addSupplier(supplier: Omit<Supplier, 'id'>) {
    const newSupplier: Supplier = {
      ...supplier,
      id: this.nextId(),
    };
    this.suppliers.update(suppliers => [...suppliers, newSupplier]);
    this.nextId.update(id => id + 1);
  }
  
  updateSupplier(updatedSupplier: Supplier) {
    this.suppliers.update(suppliers => 
      suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s)
    );
  }

  deleteSupplier(id: number) {
    this.suppliers.update(suppliers => suppliers.filter(s => s.id !== id));
  }
}