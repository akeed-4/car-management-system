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
  storeId?:number;
  branchId?:number;
  invoiceType?: string; // Taxable, Zero Rated, Exempt
  dueDate?: string; // Due date for credit invoices
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