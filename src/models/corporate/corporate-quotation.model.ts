export interface CorporateClient {
  id: number;
  companyName: string;
  companyTaxNumber?: string;
  creditLimit: number;
  currentOutstandingBalance: number;
}

export interface FleetItem {
  carModelId: number;
  carModelDescription?: string;
  quantity: number;
  unitPrice: number;
  discountRate: number; // percentage 0-100
  lineTotal: number;
}

export type CorporateQuotationStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected';

export interface CorporateQuotation {
  id?: number;
  quotationNumber?: string;
  quotationDate: string;
  clientId: number;
  clientName?: string;
  items: FleetItem[];
  subTotal: number;
  totalDiscount: number;
  totalAmount: number;
  status: CorporateQuotationStatus;
  notes?: string;
}

export interface CreateCorporateQuotationDto {
  quotationDate: string;
  clientId: number;
  items: FleetItem[];
  subTotal: number;
  totalDiscount: number;
  totalAmount: number;
  notes?: string;
}
