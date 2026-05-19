
export type DepositPaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE';
export type DepositCustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface DepositVoucher {
  id: number;
  voucherNumber: string;
  voucherType: 'DEPOSIT';
  date: Date;
  amount: number;
  paymentMethod: DepositPaymentMethod;
  customerType: DepositCustomerType;
  customerId?: number;
  customerName: string;
  reservedByNationalId?: string;
  carId: number;
  carDescription: string;
  vehiclePlateNumber?: string;
  vehicleChassisNumber?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleColor?: string;
  agreedSellingPrice?: number;
  currency?: string;
  reservationValidityDays?: number;
  finalInvoicePriceFixed?: boolean;
  creditAccountId?: number;
  debitAccountId?: number;
  accountName?: string;
  isRefundable: boolean;
  referenceType?: 'SALE_CONTRACT' | 'OTHER';
  referenceId?: number;
  notes?: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
}
