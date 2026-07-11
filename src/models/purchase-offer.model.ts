import { Supplier } from './supplier.model';
import { Car } from './car.model';

export type PurchaseOfferStatus = 'Pending' | 'Accepted' | 'Rejected';

export interface CreatePurchaseOfferDto {
  offerNumber: string;
  offerDate: Date;
  supplierId: number;
  /** The Purchase Request (Supplier Price Request) this offer is quoting against. */
  purchaseRequestId?: number;
  notes: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  taxRate?: number;
  items: CreatePurchaseOfferItemDto[];
}

export interface CreatePurchaseOfferItemDto {
  carId: number;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOfferItemDto {
  id: number;
  carId: number;
  car?: Car;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseOfferDto {
  id: number;
  offerNumber: string;
  offerDate: string;
  supplierId: number;
  supplier?: Supplier;
  supplierName?: string;
  notes?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  taxRate?: number;
  status: PurchaseOfferStatus;
  totalAmount: number;
  purchaseRequestId?: number;
  items: PurchaseOfferItemDto[];
  /** Set once this offer has been used to create a Purchase Request; hides it from the eligible dropdown. */
  convertedToRequestId?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Cascading dropdown row: approved offers with remaining un-ordered lines, for the Purchase Order screen. */
export interface ApprovedOfferLookupDto {
  id: number;
  offerNumber: string;
  offerDate: string;
  totalAmount: number;
}

/** Row shape used to auto-populate the PO grid once a purchase offer is selected. */
export interface OfferItemForPODto {
  purchaseOfferItemId: number;
  itemDescription: string;
  remainingQuantity: number;
  unitPrice: number;
}
