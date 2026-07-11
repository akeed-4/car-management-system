import { Supplier } from './supplier.model';

export type PoStatus = 'Open' | 'PartiallyReceived' | 'FullyReceived' | 'Closed' | 'Cancelled';

export interface PoItemDto {
  id: number;
  supplierRfqItemId?: number;
  purchaseOfferItemId?: number;
  purchaseRequestItemId?: number;
  itemDescription: string;
  orderedQuantity: number;
  unitPrice: number;
  lineTotal: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface PoDto {
  id: number;
  poNumber: string;
  poDate: string;
  vendorId: number;
  vendorName: string;
  supplier?: Supplier;
  supplierRfqId?: number;
  quotationNumber: string;
  purchaseOfferId?: number;
  offerNumber: string;
  purchaseRequestId?: number;
  requestNumber: string;
  status: PoStatus;
  totalAmount: number;
  expectedDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  items: PoItemDto[];
}

/** Exactly one of supplierRfqItemId/purchaseOfferItemId/purchaseRequestItemId must be set, matching the parent's type. */
export interface CreatePoItemDto {
  supplierRfqItemId?: number;
  purchaseOfferItemId?: number;
  purchaseRequestItemId?: number;
  orderedQuantity: number;
  unitPrice: number;
}

/** Exactly one of supplierRfqId/purchaseOfferId/purchaseRequestId must be set. */
export interface CreatePoDto {
  poNumber: string;
  poDate: Date | string;
  vendorId: number;
  supplierRfqId?: number;
  purchaseOfferId?: number;
  purchaseRequestId?: number;
  expectedDeliveryDate?: Date | string;
  notes?: string;
  items: CreatePoItemDto[];
}

export interface UpdatePoDto {
  status?: PoStatus;
  expectedDeliveryDate?: Date | string;
  notes?: string;
}

/** Cascading dropdown row: approved quotations with remaining un-ordered lines, for the selected vendor. */
export interface ApprovedQuotationLookupDto {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  totalAmount: number;
}

/** Row shape used to auto-populate the PO grid once a quotation is selected. */
export interface QuotationItemForPODto {
  supplierRfqItemId: number;
  itemDescription: string;
  remainingQuantity: number;
  quotedUnitPrice: number;
}
