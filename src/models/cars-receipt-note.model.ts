export type CarsReceiptNoteStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface CarsReceiptNoteItemDto {
  id: number;
  purchaseOrderItemId: number;
  /** Undefined on GRN lines created before car-level tracking was added. */
  carId?: number;
  carDescription: string;
  itemDescription: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  receivedQuantity: number;
  notes?: string;
  /** Sourced from the parent PurchaseOrderItem -- this line has no car and no price of its own. */
  unitPrice: number;
  invoicedQuantity: number;
  remainingToInvoice: number;
}

export interface CarsReceiptNoteDto {
  id: number;
  grnNumber: string;
  receiptDate: string;
  purchaseOrderId: number;
  poNumber: string;
  receivedByUserId?: number;
  status: CarsReceiptNoteStatus;
  notes?: string;
  createdAt: string;
  items: CarsReceiptNoteItemDto[];
}

export interface CreateCarsReceiptNoteItemDto {
  carId: number;
  carDescription: string;
  purchaseOrderItemId: number;
  receivedQuantity: number;
  notes?: string;
}

export interface CreateCarsReceiptNoteDto {
  grnNumber: string;
  receiptDate: Date | string;
  supplierId: number;
  purchaseOrderId: number;
  receivedByUserId?: number;
  notes?: string;
  items: CreateCarsReceiptNoteItemDto[];
}

/** Lightweight row for the active "PO Number" lookup on the GRN screen. */
export interface ActivePOLookupDto {
  id: number;
  vendorId: number;
  poNumber: string;
  poDate: string;
  vendorName: string;
  status: string;
}

/** Row shape returned to auto-populate the GRN grid once a PO is selected. */
export interface POLineForGRNDto {
  purchaseOrderItemId: number;
  itemDescription: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  remainingQuantity: number;
}
