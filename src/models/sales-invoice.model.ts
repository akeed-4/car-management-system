import { InvoiceItem } from './invoice-item.model';

export type OwnershipTransferStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Failed';

export interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: number;
  customerName: string;
  quotationId?: number;
  quotationNumber?: string;
  storeId?: number;
  salesperson?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Finance';
  paymentType?: 'Bank Transfer' | 'Cash' | 'Check';
  invoiceType?: 'Taxable' | 'Zero Rated' | 'Exempt';
  ClassificationId?: number;
  debitAccountId?: number;
  creditAccountId?: number;
  isCash?: boolean;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number; // New field
  amountDue: number;  // New field
  notes?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  ownershipTransferStatus: OwnershipTransferStatus;
  isArchived?: boolean;
}