import { Supplier } from './supplier.model';
import { Car } from './car.model';
import { PurchaseOfferDto } from './purchase-offer.model';

export type PurchaseRequestStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';

export interface CreatePurchaseRequestItemDto {
  carId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseRequestDto {
  requestNumber: string;
  requestDate: Date | string;
  supplierId: number;
  /** Optional -- Requests are now created directly from a car selection, no longer required to originate from an Offer. */
  purchaseOfferId?: number;
  notes?: string;
  items: CreatePurchaseRequestItemDto[];
}

export interface PurchaseRequestItemDto {
  id: number;
  carId: number;
  car?: Car;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseRequestDto {
  id: number;
  requestNumber: string;
  requestDate: string;
  supplierId: number;
  supplier?: Supplier;
  purchaseOfferId: number;
  purchaseOffer?: PurchaseOfferDto;
  status: PurchaseRequestStatus;
  totalAmount: number;
  items: PurchaseRequestItemDto[];
  /** Set once this request has been used to create a Purchase Order; hides it from the eligible dropdown. */
  convertedToPoId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
