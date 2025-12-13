import { InvoiceItem } from './invoice-item.model';

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string; // Added for consistency
  invoiceDate: string;
  supplierId: number;
  supplierName: string;
  storeId?: number;
  paymentMethod?: 'Cash' | 'Bank Transfer';
  items: InvoiceItem[];
  totalAmount: number;
  amountPaid: number; // New field
  amountDue: number;  // New field
  notes?: string;
  status: 'Paid' | 'Unpaid'; // Changed from Unpaid to reflect status like SalesInvoice
  isArchived?: boolean;
}