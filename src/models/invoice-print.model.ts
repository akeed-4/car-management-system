import { QrCodeContext } from './qr-code.model';

/**
 * ============================================================================
 * INVOICE PRINT — DATA LAYER CONTRACT
 * ============================================================================
 * A single, type-agnostic view model consumed by the invoice-print template
 * layer (InvoicePrintComponent) and the export layer (InvoiceExportService).
 *
 * The InvoicePrintDataService maps each concrete invoice type
 * (SalesInvoice / PurchaseInvoice / ServiceInvoice) onto this shape, so the
 * template never branches on the source module -- it only branches on
 * `type` for labels/party headings.
 */

/** The three supported invoice document types. */
export type InvoiceType = 'sales' | 'purchase' | 'service';

/** Status watermark rendered diagonally across the sheet. */
export type InvoiceWatermark = 'PAID' | 'UNPAID' | 'DRAFT' | 'COPY' | 'NONE';

/** Company / customer / supplier block shared by header and party sections. */
export interface InvoicePrintParty {
  name: string;
  /** VAT / tax registration number. */
  taxId?: string;
  /** Commercial registration number. */
  crNumber?: string;
  phone?: string;
  email?: string;
  address?: string;
  /** Purchase invoices only: the buyer's PO reference. */
  poReference?: string;
}

/** One row of the line-items table. */
export interface InvoicePrintLineItem {
  description: string;
  /** Secondary line detail, e.g. vehicle VIN. */
  detail?: string;
  quantity: number;
  /** 'hour' renders the qty column header as "Hours" (service invoices). */
  unit: 'item' | 'hour';
  unitPrice: number;
  /** Line-level discount percentage (0 when discount is invoice-level). */
  discountPercent: number;
  /** Line-level tax/VAT percentage. */
  taxPercent: number;
  lineTotal: number;
}

/** Aggregated money section. All values are in `currency`. */
export interface InvoicePrintTotals {
  subtotal: number;
  totalDiscount: number;
  /** Human-readable discount qualifier, e.g. "5%" or "Fixed". */
  discountLabel?: string;
  totalTax: number;
  /** Resolved VAT rate used for the tax summary table. */
  taxRate: number;
  grandTotal: number;
  amountPaid: number;
  amountDue: number;
  /** Sales-invoice payment breakdown extras (omitted for other types). */
  previousPayments?: number;
  downPayment?: number;
  currentPayment?: number;
  amountAfterDiscount?: number;
}

/** Bank account block rendered in the footer. All fields optional; the
 *  section is hidden entirely when no field is populated. */
export interface InvoicePrintBankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
}

/** Auction purchase annex (purchase invoices only). */
export interface InvoicePrintAuction {
  provider: string;
  lotNumber?: string;
  charges: { type: string; amount: number }[];
  total: number;
}

/** Extra key/value cells for the meta strip (payment method, salesperson...). */
export interface InvoicePrintMetaCell {
  label: string;
  value: string;
}

/** The complete, normalized document handed to the template layer. */
export interface InvoicePrintData {
  type: InvoiceType;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  status: string;
  watermark: InvoiceWatermark;
  currency: string;
  company: InvoicePrintParty;
  party: InvoicePrintParty;
  items: InvoicePrintLineItem[];
  totals: InvoicePrintTotals;
  paymentMethod?: string;
  paymentTerms: string[];
  bankDetails?: InvoicePrintBankDetails;
  notes?: string;
  auction?: InvoicePrintAuction;
  metaCells: InvoicePrintMetaCell[];
  qr?: QrCodeContext | null;
}

/** Route data contract: `data: { invoiceType: InvoiceType }`. */
export const INVOICE_TYPE_ROUTE_KEY = 'invoiceType';