export interface PaymentMethod {
  id: number;
  nameAr: string;
  nameEn: string;
  paymentType: string;
  accountId: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  isActive: boolean;
  createdBy?: number | null;
  createdDate: string;
  modifiedBy?: number | null;
  modifiedDate?: string | null;
}

export interface CreatePaymentMethodDto {
  nameAr: string;
  nameEn: string;
  paymentType: string;
  accountId: number;
  isActive: boolean;
}

export interface UpdatePaymentMethodDto extends CreatePaymentMethodDto {}

/** Fixed suggestions offered in the Payment Type dropdown on the Payment Method form -- the
 *  field itself is a free string end-to-end (frontend model, DTO, backend column), matching
 *  PurchaseInvoice.PaymentType's own convention, so a new type never needs a code change. */
export const PAYMENT_METHOD_TYPES: string[] = [
  'Cash',
  'Bank',
  'Card',
  'BankTransfer',
  'Installment',
  'Credit',
  'Other'
];
