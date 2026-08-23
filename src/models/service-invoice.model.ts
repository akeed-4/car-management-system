/**
 * Service Invoice — labor/parts billing for workshop & maintenance jobs.
 * Unlike Sales/Purchase invoices (which move vehicles), a service invoice
 * bills hours and/or fixed-price services, so its line items carry an
 * optional hours quantity and per-line discount/tax percentages.
 */
export interface ServiceInvoiceItem {
  id?: number;
  description: string;
  /** Billed hours; when absent the row bills a fixed-quantity item. */
  hours?: number;
  quantity?: number;
  /** Price per hour / per unit. */
  rate?: number;
  /** Line-level discount percentage (0-100). */
  discountPercent?: number;
  /** Line-level tax/VAT percentage (e.g. 15). */
  taxPercent?: number;
  lineTotal: number;
}

export type ServiceInvoiceStatus = 'Paid' | 'Unpaid' | 'Draft';

export interface ServiceInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerId: number;
  customerName?: string;
  /** Buyer PO reference (mirrors purchase invoices). */
  poReference?: string;
  /** Linked maintenance/service order, when the invoice was raised from one. */
  serviceOrderId?: number;
  items: ServiceInvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  vatRate?: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod?: string;
  notes?: string;
  status: ServiceInvoiceStatus;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}