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
  // Phase 2B: GL accounts are derived server-side at approval time and are never sent or
  // chosen by the client. Kept optional read-only-ish fields for API response compatibility.
  debitAccountId?: number;
  creditAccountId?: number;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
