import { InvoiceItem } from './invoice-item.model';
import { Supplier } from './supplier.model';
import { AccountNode } from './account-node.model';

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: number;
  debitAccountId: number; // Inventory or expense account
  creditAccountId: number; // Supplier, cash, or bank account
  paymentMethod?: string; // Cash, Bank Transfer
  
  invoiceType?: string; // Taxable, Zero Rated, Exempt
  dueDate?: string; // Due date for credit invoices
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  notes?: string;
  status: string; // Paid, Unpaid
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  paymentType?: string;
ClassificationId?: number;
  // Navigation properties
  supplier?: Supplier;
  debitAccount?: AccountNode;
  creditAccount?: AccountNode;
  items: InvoiceItem[];
}