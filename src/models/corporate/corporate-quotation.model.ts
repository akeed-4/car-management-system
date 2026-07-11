/** @deprecated kept only so CorporateOrderManagerComponent (not yet redesigned) keeps compiling; the backend has no corresponding endpoint. */
export interface CorporateClient {
  id: number;
  companyName: string;
  companyTaxNumber?: string;
  creditLimit: number;
  currentOutstandingBalance: number;
}

export interface CorporateQuotationLine {
  id?: number;
  carId: number;
  vin?: string;
  carDescription?: string;
  unitPrice: number;
  discountedPrice: number;
}

export type CorporateQuotationStatus = 'Draft' | 'Approved' | 'Converted' | 'Rejected' | 'Expired';

export interface CorporateQuotation {
  id?: number;
  quotationNumber?: string;
  quotationDate: string;
  expiryDate?: string;
  contactPerson?: string;
  paymentTerms?: string;
  customerId: number;
  customerName?: string;
  volumeDiscountPercent: number;
  totalAmount: number;
  status: CorporateQuotationStatus;
  notes?: string;
  lines: CorporateQuotationLine[];
}

export interface CreateCorporateQuotationDto {
  customerId: number;
  expiryDate?: string;
  contactPerson?: string;
  paymentTerms?: string;
  volumeDiscountPercent: number;
  lines: { carId: number; unitPrice?: number }[];
  notes?: string;
  userId: number;
}
