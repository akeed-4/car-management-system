export interface PaymentVoucher {
  id: number;
  voucherNumber: string;
  date: string;
  supplierId: number;
  supplierName: string;
  purchaseInvoiceId: number;
  purchaseInvoiceNumber: string;
  amount: number;
  paymentMethod: string;
  accountId: number;
  accountName: string;
}