import { InvoiceAllocation, CreateInvoiceAllocation } from './invoice-allocation.model';

export enum ReceiptSource {
  Sale = 0,
  Installment = 1,
  Other = 2,
}

/** Mirrors the backend's ReceiptDto (CarERP.Core/DTOs/Accounting/ReceiptDto.cs). */
export interface Receipt {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  totalAmount: number;
  creditAccountId?: number;
  creditAccountName?: string;
  debitAccountId?: number;
  debitAccountName?: string;
  customerId: number;
  customerName?: string;
  source: ReceiptSource;
  sourceName?: string;
  referenceId?: number; // Sales invoice id when source = Sale (legacy single-invoice link)
  status?: number;
  statusName?: string;
  notes?: string;
  createdAt?: string;
  createdBy?: number;
  customerOrderId?: number;
  receiptDetails: ReceiptDetail[];
  invoiceAllocations: InvoiceAllocation[];
}

export interface ReceiptDetail {
  id?: number;
  incomeAccountId: number;
  incomeAccountName?: string;
  carId?: number;
  carDescription?: string;
  amount: number;
  note?: string;
}

export interface CreateReceiptDto {
  voucherNumber: string;
  voucherDate: string;
  totalAmount: number;
  creditAccountId: number;
  debitAccountId: number;
  customerId: number;
  source: ReceiptSource;
  referenceId?: number;
  notes?: string;
  customerOrderId?: number;
  receiptDetails: { incomeAccountId: number; carId?: number; amount: number; note?: string }[];
  invoiceAllocations: CreateInvoiceAllocation[];
}
