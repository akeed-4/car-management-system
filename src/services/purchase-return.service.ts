import { Injectable, signal } from '@angular/core';
import { PurchaseReturnInvoice } from '../types/purchase-return-invoice.model';

@Injectable({
  providedIn: 'root',
})
export class PurchaseReturnService {
  private nextId = signal(1);
  private returnInvoices = signal<PurchaseReturnInvoice[]>([]);

  public returnInvoices$ = this.returnInvoices.asReadonly();

  addReturnInvoice(invoice: Omit<PurchaseReturnInvoice, 'id'>) {
    const newReturnInvoice: PurchaseReturnInvoice = {
      ...invoice,
      id: this.nextId(),
    };
    this.returnInvoices.update(invoices => [...invoices, newReturnInvoice]);
    this.nextId.update(id => id + 1);
  }
}
