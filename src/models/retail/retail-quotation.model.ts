export type RetailQuotationStatus = 'Active' | 'Converted' | 'Expired' | 'Cancelled';

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

export interface RetailQuotationLineDto {
  id: number;
  carId: number;
  vin: string;
  carDescription: string;
  quotedPrice: number;
}

export interface RetailQuotation {
  id: number;
  quotationNumber: string;
  customerName: string;
  customerMobile: string;
  customerNationalId: string;
  quotationDate: string;
  status: RetailQuotationStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  lines: RetailQuotationLineDto[];
}

export interface CreateRetailQuotationLineDto {
  carId?: number;
  vin?: string;
}

export interface CreateRetailQuotationDto {
  customerName: string;
  customerMobile: string;
  customerNationalId: string;
  lines: CreateRetailQuotationLineDto[];
  notes?: string;
  userId: number;
}
