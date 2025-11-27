import { ReturnInvoiceItem } from './return-invoice-item.model';

export interface PurchaseReturnInvoice {
  id: number;
  returnInvoiceNumber: string;
  returnInvoiceDate: string;
  originalInvoiceId: number;
  supplierId: number;
  supplierName: string;
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
