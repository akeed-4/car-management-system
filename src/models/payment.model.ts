import { Account } from '../components/accounting/models';
import { Car } from './car.model';
import { PurchaseInvoice } from './purchase-invoice.model';
import { Voucher } from './voucher.model';

export enum BeneficiaryType {
  Supplier = 1,
  Employee = 2,
  Customer = 3
}

export interface Payment extends Voucher {
  beneficiaryType: BeneficiaryType;
  beneficiaryId?: number;
  accountId: number; // Source account for the payment

  // ربط الدفعة بفاتورة شراء كاملة
  purchaseInvoiceId?: number;
  purchaseInvoice?: PurchaseInvoice;

  details: PaymentDetail[];
}

export interface PaymentDetail {
  id?: number;
  paymentId?: number;

  expenseAccountId?: number;
  expenseAccount?: any; // Account type

  chassisNumber: string;
  model: string;
  carId?: number;
  car?: Car;

  amount: number;
  note?: string;
}