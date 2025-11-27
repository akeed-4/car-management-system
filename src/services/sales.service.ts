import { Injectable, signal } from '@angular/core';
import { SalesInvoice } from '../types/sales-invoice.model';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private nextId = signal(2);
  private invoices = signal<SalesInvoice[]>([
    {
      id: 1,
      invoiceNumber: 'INV-202405201130',
      invoiceDate: '2024-05-20',
      dueDate: '2024-06-20',
      customerId: 2,
      customerName: 'فاطمة خالد',
      salesperson: 'أحمد',
      paymentMethod: 'Finance',
      items: [
        { carId: 2, carDescription: 'Ford Explorer (2022)', quantity: 1, unitPrice: 155000, lineTotal: 155000 }
      ],
      subtotal: 155000,
      vatAmount: 23250,
      totalAmount: 178250,
      amountPaid: 178250, // Initial mock value for paid
      amountDue: 0,      // Initial mock value for due
      notes: 'تم الاتفاق على التسليم خلال 3 أيام عمل.',
      status: 'Paid',
    }
  ]);

  public invoices$ = this.invoices.asReadonly();

  getInvoiceById(id: number): SalesInvoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  getOutstandingInvoicesByCustomerId(customerId: number): SalesInvoice[] {
    return this.invoices().filter(inv => inv.customerId === customerId && inv.status !== 'Paid' && inv.amountDue > 0);
  }

  addInvoice(invoice: Omit<SalesInvoice, 'id' | 'amountPaid' | 'amountDue'>) {
    const newInvoice: SalesInvoice = {
      ...invoice,
      id: this.nextId(),
      amountPaid: 0, // Initially no payment received
      amountDue: invoice.totalAmount, // Full amount is due
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
             // If there's partial payment, keep it pending, unless it's overdue
             newStatus = 'Pending'; // Or check if dueDate is passed for 'Overdue'
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