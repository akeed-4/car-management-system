export type RetailPaymentMethod = 'Cash' | 'Card' | 'Bank Transfer';

export interface RetailPaymentDetails {
  method: RetailPaymentMethod;
  amount: number;
  reference?: string; // Card auth code / bank transfer reference
  hash?: string; // Transaction hash/id for card or bank transfer
}

export interface RetailInvoiceLineSummary {
  carId: number;
  carDescription: string;
  unitPrice: number;
}

export interface RetailInvoice {
  id?: number;
  invoiceNumber?: string;
  invoiceDate: string;
  quotationId: number;
  customer: {
    name: string;
    mobile: string;
    nationalId: string;
  };
  items: RetailInvoiceLineSummary[];
  subTotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  payment: RetailPaymentDetails;
  status?: 'Draft' | 'Posted' | 'Paid';
}

export interface CreateRetailInvoiceDto {
  invoiceDate: string;
  quotationId: number;
  discount: number;
  tax: number;
  payment: RetailPaymentDetails;
}
