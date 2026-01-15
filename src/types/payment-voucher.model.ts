import { Account } from "../components/accounting/models";
import { PurchaseInvoice } from "./purchase-invoice.model";

export enum PaymentMethod {
  Cash = 1,
  Bank = 2
}

export enum VoucherStatus {
  Draft = 1,
  Approved = 2,
  Cancelled = 3
}

export enum BeneficiaryType {
  Supplier = 1,
  Employee = 2,
  Customer = 3
}

// Unified Model
export class PaymentVoucher {
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

  // Beneficiary fields
  beneficiaryType!: BeneficiaryType;
  beneficiaryId!: number; // Supplier / Employee / Customer
  referenceId?: number;   // Expense / Invoice

  // Legacy fields
  date!: Date;
  paymentNumber: string = '';
  purchaseInvoiceId?: number;
  supplierName: string = '';
  description: string = '';
}

