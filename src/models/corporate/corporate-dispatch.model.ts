export interface OrderFulfillmentProgress {
  orderId: number;
  totalOrdered: number;
  totalDelivered: number;
  remaining: number;
}

export interface RemainingVinCandidate {
  carId: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  unitPrice: number;
}

export interface DeliveryNoteResult {
  id: number;
  deliveryNoteNumber: string;
  /** Null until an invoice is created from this delivery note. */
  salesInvoiceId?: number;
  carId: number;
  vin: string;
  carDescription?: string;
  gatePassSerial: string;
  deliveryDate: string;
  deliveredToName?: string;
  deliveredToNationalId?: string;
  deliveredToPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
}

/** Dispatch creates the delivery note(s) only -- invoicing is a separate later step. */
export interface DispatchBatchDto {
  customerOrderId: number;
  carIds: number[];
  receiverName?: string;
  receiverNationalId?: string;
  receiverPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
  userId: number;
}

export interface CreateCorporateInvoiceFromQuotationDto {
  corporateQuotationId: number;
  debitAccountId: number;
  creditAccountId: number;
  userId: number;
}

export interface CreateCorporateInvoiceFromDeliveryDto {
  deliveryNoteIds: number[];
  debitAccountId: number;
  creditAccountId: number;
  userId: number;
}
