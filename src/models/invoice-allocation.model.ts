/** Mirrors the backend's InvoiceAllocationDto/CreateInvoiceAllocationDto (CarERP.Core/DTOs/
 *  Accounting/ReceiptDto.cs) -- identical shape reused by both Payment (purchase invoices) and
 *  Receipt (sales invoices), so this one model backs both PaymentInvoiceAllocation and
 *  ReceiptInvoiceAllocation server-side rows instead of duplicating the interface per voucher. */
export interface InvoiceAllocation {
  id?: number;
  invoiceId: number;
  invoiceNumber?: string;
  amount: number;
}

export interface CreateInvoiceAllocation {
  invoiceId: number;
  amount: number;
}

/** A candidate outstanding invoice offered to the allocation grid before any amount has been
 *  assigned to it -- distinct from InvoiceAllocation, which represents a row the user has
 *  actually committed an amount to. */
export interface AllocatableInvoice {
  invoiceId: number;
  invoiceNumber: string;
  amountDue: number;
}
