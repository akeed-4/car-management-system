import { ReturnInvoiceItem } from './return-invoice-item.model';

export type PurchaseReturnType = 'CASH' | 'CREDIT';

export interface PurchaseReturnInvoice {
  id: number;
  returnInvoiceNumber: string;
  returnInvoiceDate: string;
  originalInvoiceId: number;
  supplierId: number;
  supplierName: string;
  returnType: PurchaseReturnType;
  debitAccountId?: number; // For cash returns - cash/bank account
  creditAccountId?: number; // For credit returns - supplier account
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
