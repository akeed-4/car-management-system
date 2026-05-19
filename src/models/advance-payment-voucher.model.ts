/**
 * Advance Payment Voucher Model
 * Represents a deposit/down payment made by a customer to reserve a vehicle
 */
export interface AdvancePaymentVoucher {
  id?: number;
  voucherNumber: string;
  customerId: number;
  customerName?: string;
  vehicleId?: number;
  vehicleVin?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'BankTransfer' | 'Check' | 'Card';
  referenceNumber?: string;
  bankId?: number;
  bankName?: string;
  checkNumber?: string;
  checkDate?: string;
  isLinkedToOrder: boolean;
  linkedOrderId?: number;
  linkedOrderNumber?: string;
  linkedInvoiceId?: number;
  remainingAmount: number;
  status: 'Active' | 'Consumed' | 'Refunded' | 'Cancelled';
  notes?: string;
  createdBy?: string;
  createdDate: string;
  lastUpdated?: string;
}

/**
 * DTO for creating a new advance payment voucher
 */
export interface CreateAdvancePaymentVoucherDto {
  customerId: number;
  vehicleId?: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'BankTransfer' | 'Check' | 'Card';
  referenceNumber?: string;
  bankId?: number;
  checkNumber?: string;
  checkDate?: string;
  notes?: string;
}

/**
 * DTO for linking voucher to order
 */
export interface LinkVoucherToOrderDto {
  voucherId: number;
  orderId: number;
  amountToConsume: number;
}
