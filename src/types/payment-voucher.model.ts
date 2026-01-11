export interface PaymentVoucher {
  id: number;
  voucherNumber: string;
  voucherType: 'PAYMENT';
  date: Date;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  accountId: number;
  accountName: string;
  supplierId: number;
  supplierName: string;
  purchaseInvoiceId?: number | null;
  purchaseInvoiceNumber?: string | null;
  referenceType?: 'INVOICE' | 'SALE_CONTRACT' | 'EXPENSE' | 'OTHER';
  referenceId?: number;
  notes?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy: number;
  createdAt: Date;
}