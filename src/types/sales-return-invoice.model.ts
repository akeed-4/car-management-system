import { ReturnInvoiceItem } from './return-invoice-item.model';

export interface SalesReturnInvoice {
  id: number;
  returnInvoiceNumber: string;
  returnInvoiceDate: string;
  originalInvoiceId: number;
  originalInvoiceNumber: string;
  customerId: number;
  customerName: string;
  paymentMethod?: string;
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
