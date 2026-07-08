export type RetailQuotationStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected';

export interface RetailCustomerInfo {
  name: string;
  mobile: string;
  nationalId: string;
}

export interface RetailQuotationItem {
  carId: number;
  carDescription?: string;
  unitPrice: number;
}

export interface RetailQuotation {
  id?: number;
  quotationNumber?: string;
  quotationDate: string;
  customer: RetailCustomerInfo;
  items: RetailQuotationItem[];
  totalAmount: number;
  status: RetailQuotationStatus;
  notes?: string;
  createdAt?: string;
}

export interface CreateRetailQuotationDto {
  quotationDate: string;
  customer: RetailCustomerInfo;
  items: RetailQuotationItem[];
  totalAmount: number;
  notes?: string;
}
