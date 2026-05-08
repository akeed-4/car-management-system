import { PaymentMethod, VoucherStatus, BeneficiaryType } from "./payment-voucher.model";

// Unified Model
export class ReceiptVoucher {
  // Base Voucher fields
  id!: number;
  voucherNumber: string = '';
  voucherDate!: Date;
  amount!: number;
  paymentMethod!: PaymentMethod;
  accountId!: number; // Cash / Bank
  status!: VoucherStatus;
  notes?: string;
  createdAt: Date = new Date();
  createdBy!: number;
customerId?: number;
  // Beneficiary fields
  beneficiaryType!: BeneficiaryType;
  beneficiaryId!: number; // Supplier / Employee / Customer
  referenceId?: number;   // Expense / Invoice

  // Legacy fields
  date!: Date;
  paymentNumber: string = '';
  salesInvoiceId?: number;
  customerName: string = '';
  description: string = '';

  // Navigation (frontend references)
}

export interface SimpleReceiptVoucher {
  id?: number;
  totalAmount: number;
  date: string;
  paymentMethod: string;
  sourceAccountId: number;
  details: SimpleReceiptDetail[];
}

export interface SimpleReceiptDetail {
  incomeAccountId: number | null;
  carId?: number | null;
  amount: number;
  note: string;
  balance?: number;
}

