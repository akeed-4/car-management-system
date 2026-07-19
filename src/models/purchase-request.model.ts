import { Supplier } from './supplier.model';
import { Car } from './car.model';

/** Backend returns 'Pending' -- 'PendingApproval' is kept for backward compatibility with any older records. */
export type PurchaseRequestStatus = 'Draft' | 'Pending' | 'PendingApproval' | 'Approved' | 'Rejected';

export interface CreatePurchaseRequestItemDto {
  carId: number;
  carDescription?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseRequestDto {
  requestNumber: string;
  requestDate: Date | string;
  supplierId: number;
  notes?: string;
  items: CreatePurchaseRequestItemDto[];
}

export interface PurchaseRequestItemDto {
  id: number;
  carId: number;
  car?: Car;
  carDescription?: string;
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
  supplierName?: string;
  status: PurchaseRequestStatus;
  totalAmount: number;
  items: PurchaseRequestItemDto[];
  /** Set once this request has been used to create a Purchase Order; hides it from the eligible dropdown. */
  convertedToPoId?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
