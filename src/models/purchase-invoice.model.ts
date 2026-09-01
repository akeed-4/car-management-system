import { InvoiceItem } from './invoice-item.model';
import { Supplier } from './supplier.model';
import { AccountNode } from './account-node.model';

export interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  supplierId: number;
  /**
   * Debit (Inventory/Expense) leg. Always populated on a read (GET) response -- the server's
   * resolved/stored value. On a Create/Update request body this doubles as an OPTIONAL client
   * override: when sent, validated server-side (exists, tenant-scoped, active, postable) and
   * used verbatim for the posted JournalEntryLine; when omitted/undefined, the server falls back
   * to its existing derivation (Store's inventory accounting configuration) -- exactly what every
   * invoice created before this override existed continues to do.
   */
  debitAccountId?: number;
  /**
   * Credit leg (Supplier AP on a credit purchase, Cash/Bank on a cash purchase). This document's
   * system-resolved side -- always populated on a read response, but never accepted as a client
   * override on Create/Update; the server always derives it and ignores any value sent here.
   */
  creditAccountId: number;
  paymentMethod?: string; // Cash, Bank Transfer
  storeId?:number;
  branchId?:number;
  invoiceType?: string; // Taxable, Zero Rated, Exempt
  dueDate?: string; // Due date for credit invoices
  /** VAT-exclusive amount -- only populated when the invoice contains a profit-margin-VAT car
   * (backend only overwrites Subtotal/VATAmount in that case; standard invoices leave these
   * unset and carry the full breakdown in totalAmount only). */
  subtotal?: number;
  vatAmount?: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  initialPayment?: number; // Down payment made at creation time for a credit invoice
  notes?: string;
  status: string; // Paid, Unpaid
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  paymentType?: string;
  carReceiptIds?: number[]; // Car Receipts (GRNs) this invoice was generated from
ClassificationId?: number;
  /**
   * CASH purchases only: the requested Cash/Bank settlement account (the entry's credit leg:
   * Dr Inventory / Cr Payment Account). Purely a *request* -- the backend re-validates it
   * (tenant/active/postable/Cash-Bank family) and falls back to the tenant's seeded default
   * Cash account when omitted. Ignored by the backend for CREDIT purchases, whose credit leg
   * is always the supplier's server-resolved Accounts Payable account.
   */
  paymentAccountId?: number;
  // Navigation properties
  supplier?: Supplier;
  debitAccount?: AccountNode;
  creditAccount?: AccountNode;
  items: InvoiceItem[];

  /** Non-null identifies this as an auction purchase (e.g. "BCA", "Copart", "Manheim"). */
  auctionProvider?: string | null;
  auctionLotNumber?: string | null;
  auctionCharges?: AuctionCharge[];
  /** Sum of auctionCharges -- convenience field, not persisted separately. */
  auctionChargesTotal?: number;
}

export interface AuctionCharge {
  id?: number;
  chargeType: string; // BuyerFee, GateFee, TransportFee, ...
  amount: number;
  description?: string | null;
}