import { InvoiceItem } from './invoice-item.model';
import { SalesChannel } from './enums/sales-channel.enum';
import { SaleType } from './sales-enhancements.model';
import { DiscountType } from './sales-invoice-financials';

export type OwnershipTransferStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Failed';

export interface SalesInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: number;
  customerName: string;
  quotationId?: number;
  quotationNumber?: string;
  sourceOrderId?: number;
  storeId?: number;
  salesperson?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Finance';
  paymentType?: 'Bank Transfer' | 'Cash' | 'Check';
  invoiceType?: 'Taxable' | 'Zero Rated' | 'Exempt';
  ClassificationId?: number;
  debitAccountId?: number;
  creditAccountId?: number;
  isCash?: boolean;
  salesChannel?: SalesChannel;
  saleType?: SaleType;
  downPayment?: number;
  ownerCustomerId?: number;
  ownerCustomerName?: string;
  funderBankId?: number;
  funderBankName?: string;
  items: InvoiceItem[];
  /** Subtotal before discount -- sum of all line totals. */
  subtotal: number;
  discountType?: DiscountType;
  /** Raw entered discount: a currency amount when discountType is Fixed, a percent number (0-100) when Percentage. */
  discountValue?: number;
  /** Resolved monetary discount amount (always in currency, regardless of discountType). */
  discountAmount?: number;
  /** subtotal - discountAmount. */
  amountAfterDiscount?: number;
  /** VAT percentage applied (0 or 15), resolved from the invoice classification or invoiceType. */
  vatRate?: number;
  vatAmount: number;
  /** amountAfterDiscount + vatAmount. */
  totalAmount: number;
  /** Payments recorded before this invoice/payment event (e.g. a deposit already collected on the vehicle). */
  previousPayments?: number;
  /** Payment captured in this transaction (cash received now, or the down payment being entered). */
  currentPayment?: number;
  amountPaid: number; // New field
  amountDue: number;  // New field
  /** Alias of amountDue shown in the financial breakdown. */
  remainingBalance?: number;
  notes?: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  ownershipTransferStatus: OwnershipTransferStatus;
  isArchived?: boolean;
}