export interface CarPaymentVoucher {
  id?: number;
  voucherNumber: string;
  voucherDate: string;
  totalAmount: number;
  accountId: number;
  purchaseInvoiceId: number;
  details: CarPaymentDetail[];
}

export interface CarPaymentDetail {
  expenseAccountId: number | null;
  carId: number | null;
  amount: number;
  note: string;
}