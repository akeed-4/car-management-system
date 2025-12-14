export interface PaymentVoucher {
  id: number;
  voucherNumber: string;
  date: string;
  supplierId: number;
  supplierName: string;
  purchaseInvoiceId?: number | null;
  purchaseInvoiceNumber?: string | null;
  amount: number;
  paymentMethod: string;
  accountId: number;
  accountName: string;
}