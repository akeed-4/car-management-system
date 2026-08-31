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
  /** DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/COMPLETED -- present on the real API response
   *  (SalesReturnDto.Status) though historically left off this interface; used to lock the
   *  account override fields once a return is posted. */
  status?: string;

  /** Server-derived, stamped at approval -- the actually-posted accounts. Zero/absent on an
   *  unapproved return. */
  debitAccountId?: number;
  debitAccountName?: string;
  creditAccountId?: number;
  creditAccountName?: string;

  /** Client-selectable override -- see SalesReturn.debitAccountOverrideId for the full
   *  "default + override" contract. */
  debitAccountOverrideId?: number | null;
  debitAccountOverrideName?: string;
  creditAccountOverrideId?: number | null;
  creditAccountOverrideName?: string;
}
