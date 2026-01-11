export interface ReceiptVoucher {
  id: number;
  voucherNumber: string;
  voucherType: 'RECEIPT';
  date: Date;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  accountId: number;
  accountName: string;
  customerId: number;
  customerName: string;
  salesInvoiceId: number;
  salesInvoiceNumber: string;
  referenceType?: 'INVOICE' | 'SALE_CONTRACT' | 'EXPENSE' | 'OTHER';
  referenceId?: number;
  notes?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy: number;
  createdAt: Date;
}