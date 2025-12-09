export interface ReceiptVoucher {
  id: number;
  voucherNumber: string;
  date: string;
  customerId: number;
  customerName: string;
  salesInvoiceId: number;
  salesInvoiceNumber: string;
  amount: number;
  paymentMethod: string;
  accountId: number;
  accountName: string;
}