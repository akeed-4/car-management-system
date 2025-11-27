import { Injectable, signal } from '@angular/core';
import { PurchaseInvoice } from '../types/purchase-invoice.model';

@Injectable({
  providedIn: 'root',
})
export class ProcurementService {
  private nextId = signal(3);
  private invoices = signal<PurchaseInvoice[]>([
    {
      id: 1,
      invoiceNumber: 'PO-202405181000',
      invoiceDate: '2024-05-18',
      supplierId: 1,
      supplierName: 'شركة النهدي للسيارات',
      paymentMethod: 'Bank Transfer',
      items: [
        { carId: 1, carDescription: 'Toyota Camry (2023)', quantity: 1, unitPrice: 97500, lineTotal: 97500 }
      ],
      totalAmount: 97500,
      amountPaid: 97500,
      amountDue: 0,
      status: 'Paid',
      notes: 'شامل تكاليف النقل.'
    },
    {
      id: 2,
      invoiceNumber: 'PO-202405151400',
      invoiceDate: '2024-05-15',
      supplierId: 2,
      supplierName: 'مزاد السيارات الدولي',
      paymentMethod: 'Cash',
      items: [
        { carId: 3, carDescription: 'BMW X5 (2023)', quantity: 1, unitPrice: 287000, lineTotal: 287000 }
      ],
      totalAmount: 287000,
      amountPaid: 287000,
      amountDue: 0,
      status: 'Paid',
    },
  ]);

  public invoices$ = this.invoices.asReadonly();

  getInvoiceById(id: number): PurchaseInvoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }
  
  getOutstandingInvoicesBySupplierId(supplierId: number): PurchaseInvoice[] {
    return this.invoices().filter(inv => inv.supplierId === supplierId && inv.status !== 'Paid' && inv.amountDue > 0);
  }

  addInvoice(invoice: Omit<PurchaseInvoice, 'id' | 'amountPaid' | 'amountDue'>) {
    const newInvoice: PurchaseInvoice = {
      ...invoice,
      id: this.nextId(),
      amountPaid: 0,
      amountDue: invoice.totalAmount,
    };
    this.invoices.update(invoices => [...invoices, newInvoice]);
    this.nextId.update(id => id + 1);
  }

  applyPayment(invoiceId: number, paymentAmount: number) {
    this.invoices.update(invoices =>
      invoices.map(invoice => {
        if (invoice.id === invoiceId) {
          const newAmountPaid = invoice.amountPaid + paymentAmount;
          const newAmountDue = invoice.totalAmount - newAmountPaid;
          let newStatus = invoice.status;

          if (newAmountDue <= 0) {
            newStatus = 'Paid';
          } else if (newAmountPaid > 0 && newAmountDue > 0) {
            newStatus = 'Unpaid'; // Keep as unpaid if partially paid
          }

          return {
            ...invoice,
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
          };
        }
        return invoice;
      })
    );
  }
}