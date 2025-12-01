

import { Injectable, signal } from '@angular/core';
import { SalesInvoice } from '../types/sales-invoice.model';
import { InventoryService } from './inventory.service'; // Import InventoryService
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private nextId = signal(3); // Updated nextId
  private inventoryService = inject(InventoryService); // Inject InventoryService

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
      amountPaid: 178250,
      amountDue: 0,
      notes: 'تم الاتفاق على التسليم خلال 3 أيام عمل.',
      status: 'Paid',
      ownershipTransferStatus: 'Completed',
      isArchived: false,
    },
    { // New mock invoice for delivery scheduling
      id: 2,
      invoiceNumber: 'INV-202406010900',
      invoiceDate: '2024-06-01',
      dueDate: '2024-07-01',
      customerId: 1,
      customerName: 'عبدالله محمد',
      salesperson: 'خالد',
      paymentMethod: 'Cash',
      items: [
        { carId: 1, carDescription: 'Toyota Camry (2023)', quantity: 1, unitPrice: 110000, lineTotal: 110000 }
      ],
      subtotal: 110000,
      vatAmount: 16500,
      totalAmount: 126500,
      amountPaid: 126500,
      amountDue: 0,
      notes: 'جاهزة للتسليم.',
      status: 'Paid',
      ownershipTransferStatus: 'Completed',
      isArchived: false,
    }
  ]);

  public invoices$ = this.invoices.asReadonly();

  getInvoiceById(id: number): SalesInvoice | undefined {
    return this.invoices().find(inv => inv.id === id);
  }

  getOutstandingInvoicesByCustomerId(customerId: number): SalesInvoice[] {
    return this.invoices().filter(inv => inv.customerId === customerId && inv.status !== 'Paid' && inv.amountDue > 0);
  }

  getInvoicesByCustomerId(customerId: number): SalesInvoice[] {
    return this.invoices().filter(inv => inv.customerId === customerId);
  }

  addInvoice(invoice: Omit<SalesInvoice, 'id' | 'amountPaid' | 'amountDue' | 'ownershipTransferStatus'>) {
    const newInvoice: SalesInvoice = {
      ...invoice,
      id: this.nextId(),
      amountPaid: 0, // Initially no payment received
      amountDue: invoice.totalAmount, // Full amount is due
      ownershipTransferStatus: 'Not Started',
      isArchived: false,
    };
    this.invoices.update(invoices => [...invoices, newInvoice]);
    this.nextId.update(id => id + 1);
  }
  
  async initiateOwnershipTransfer(invoiceId: number): Promise<boolean> {
    // 1. Set status to 'In Progress'
    this.invoices.update(invoices =>
      invoices.map(inv =>
        inv.id === invoiceId ? { ...inv, ownershipTransferStatus: 'In Progress' } : inv
      )
    );

    // 2. Simulate API call
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay

    // 3. Simulate success/failure and update status
    const isSuccess = Math.random() < 0.8; // 80% success rate

    if (isSuccess) {
      this.invoices.update(invoices =>
        invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, ownershipTransferStatus: 'Completed' } : inv
        )
      );
      // Update inventory status to 'Sold' AFTER successful transfer
      const invoice = this.getInvoiceById(invoiceId);
      if (invoice) {
        invoice.items.forEach(item => {
          this.inventoryService.updateCarStatus(item.carId, 'Sold');
        });
      }
    } else {
      this.invoices.update(invoices =>
        invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, ownershipTransferStatus: 'Failed' } : inv
        )
      );
    }
    
    return isSuccess;
  }

  applyPayment(invoiceId: number, paymentAmount: number) {
    // Fix: Ensure the map callback always returns a SalesInvoice object.
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
             newStatus = 'Pending'; // Or check if
          }
          return {
            ...invoice,
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
          };
        }
        return invoice; // Always return the invoice if no match
      })
    );
  }

  // Fix: Added archiveInvoice method
  archiveInvoice(id: number) {
    this.invoices.update(invoices =>
      invoices.map(inv => (inv.id === id ? { ...inv, isArchived: true } : inv))
    );
  }

  // Fix: Added unarchiveInvoice method
  unarchiveInvoice(id: number) {
    this.invoices.update(invoices =>
      invoices.map(inv => (inv.id === id ? { ...inv, isArchived: false } : inv))
    );
  }
}