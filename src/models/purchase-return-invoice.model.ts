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
  // GL accounts are derived server-side at approval time (or taken from the validated override
  // below when present) and stamped back for traceability -- read-only response fields, never
  // client-computed.
  debitAccountId?: number;
  debitAccountName?: string;
  creditAccountId?: number;
  creditAccountName?: string;

  /** Client-selectable override, following the "default + override" pattern used across
   *  Receipt/Payment/Deposit/PurchaseAdditionalCost/ConsignmentSale/SalesReturn. Validated
   *  server-side (exists, tenant-scoped, active, postable) at Create/Update; consumed instead of
   *  the resolved default at approval time when present. */
  debitAccountOverrideId?: number | null;
  debitAccountOverrideName?: string;
  creditAccountOverrideId?: number | null;
  creditAccountOverrideName?: string;

  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  items: ReturnInvoiceItem[];
  totalAmount: number;
}
