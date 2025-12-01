import { Injectable, signal } from '@angular/core';
import { SalesReturnInvoice } from '../types/sales-return-invoice.model';

@Injectable({
  providedIn: 'root',
})
export class SalesReturnService {
  private nextId = signal(1);
  private returnInvoices = signal<SalesReturnInvoice[]>([]);

  public returnInvoices$ = this.returnInvoices.asReadonly();

  addReturnInvoice(invoice: Omit<SalesReturnInvoice, 'id'>) {
    const newReturnInvoice: SalesReturnInvoice = {
      ...invoice,
      id: this.nextId(),
    };
    this.returnInvoices.update(invoices => [...invoices, newReturnInvoice]);
    this.nextId.update(id => id + 1);
  }
}
