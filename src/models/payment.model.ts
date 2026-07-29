import { Account } from '../components/accounting/models';
import { Car } from './car.model';
import { PurchaseInvoice } from './purchase-invoice.model';
import { Voucher, VoucherStatus } from './voucher.model';
import { InvoiceAllocation } from './invoice-allocation.model';

export enum BeneficiaryType {
  Supplier = 1,
  Employee = 2,
  Customer = 3
}

export interface Payment {
  id?:               number;
  voucherNumber:     string;
  voucherDate:       Date;
  amount:            number;
  status:            VoucherStatus;
  notes?:            string;
  createdBy:         number;
  createdAt?:        Date;
  updatedAt?:        Date;
  beneficiaryType:   BeneficiaryType;
  beneficiaryId?:    number;
  purchaseInvoiceId?:number;
  debitAccountId:    number;      // ← NEW
  creditAccountId:   number;      // ← NEW
  details:           PaymentDetail[];
  invoiceAllocations: InvoiceAllocation[];
}

export interface PaymentDetail {
  id?:           number;
  paymentId?:    number;
  carId?:        number;
  chassisNumber: string;
  model:         string;
  amount:        number;
  note?:         string;
}