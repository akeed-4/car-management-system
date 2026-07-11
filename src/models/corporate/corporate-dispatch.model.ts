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
  salesInvoiceId: number;
  carId: number;
  vin: string;
  gatePassSerial: string;
  deliveryDate: string;
  deliveredToName?: string;
  deliveredToNationalId?: string;
  deliveredToPhone?: string;
  driverName?: string;
}

export interface CorporateBatchResult {
  invoice: { id: number; invoiceNumber: string; totalAmount: number };
  deliveryNotes: DeliveryNoteResult[];
}

export interface ProcessBatchDto {
  customerOrderId: number;
  carIds: number[];
  debitAccountId: number;
  creditAccountId: number;
  receiverName?: string;
  receiverNationalId?: string;
  receiverPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
  userId: number;
}
