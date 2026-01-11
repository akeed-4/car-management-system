
export interface AdvancePaymentVoucher {
  id: number;
  voucherNumber: string;
  voucherType: 'DEPOSIT';
  date: Date;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  accountId: number;
  accountName: string;
  customerId: number;
  customerName: string;
  carId: number;
  carDescription: string;
  isRefundable: boolean;
  referenceType?: 'SALE_CONTRACT' | 'OTHER';
  referenceId?: number;
  notes?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy: number;
  createdAt: Date;
}
