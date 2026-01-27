import { ReturnInvoiceItem } from './return-invoice-item.model';

export interface SalesReturnInvoice {
  invoiceNo: any;
  reason: string;
  returnDate: string | number | Date;
  isCash: boolean;
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
