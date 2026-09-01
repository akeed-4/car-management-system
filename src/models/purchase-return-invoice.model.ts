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
  // GL accounts are derived server-side at approval time and stamped back for traceability --
  // read-only response fields, never client-computed. There is no client override path.
  debitAccountId?: number;
  debitAccountName?: string;
  creditAccountId?: number;
  creditAccountName?: string;

  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
