export interface CorporateOrderLine {
  id?: number;
  carId: number;
  vin?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CorporateOrder {
  id?: number;
  customerId: number;
  customerName?: string;
  orderDate: string;
  status?: string;
  totalAmount: number;
  customerPoReference: string;
  paymentTerms: string;
  expectedDeliveryDate?: string;
  salesRepresentative?: string;
  notes?: string;
  corporateQuotationId?: number;
  lines: CorporateOrderLine[];
}

export interface CreateCorporateOrderDto {
  corporateQuotationId: number;
  customerPoReference: string;
  paymentTerms: string;
  expectedDeliveryDate?: string;
  salesRepresentative?: string;
  notes?: string;
  userId: number;
}
