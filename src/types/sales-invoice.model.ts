import { InvoiceItem } from './invoice-item.model';

export interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: number;
  customerName: string;
  salesperson?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Finance';
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number; // New field
  amountDue: number;  // New field
  notes?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}