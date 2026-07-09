export type CarsReceiptNoteStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface CarsReceiptNoteItemDto {
  id: number;
  purchaseOrderItemId: number;
  itemDescription: string;
  orderedQuantity: number;
  previouslyReceivedQuantity: number;
  receivedQuantity: number;
  notes?: string;
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
  purchaseOrderItemId: number;
  receivedQuantity: number;
  notes?: string;
}

export interface CreateCarsReceiptNoteDto {
  grnNumber: string;
  receiptDate: Date | string;
  purchaseOrderId: number;
  receivedByUserId?: number;
  notes?: string;
  items: CreateCarsReceiptNoteItemDto[];
}

/** Lightweight row for the active "PO Number" lookup on the GRN screen. */
export interface ActivePOLookupDto {
  id: number;
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
