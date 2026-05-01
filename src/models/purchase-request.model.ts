import { Supplier } from './supplier.model';

export interface PurchaseRequestItem {
  id?: number;
  carDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  notes?: string;
}

export interface PurchaseRequest {
  id?: number;
  requestNumber: string;
  requestDate: string;
  supplierId: number;
  supplier?: Supplier;
  descriptionAr?: string;
  descriptionEn?: string;
  referenceNumber?: string;
  status?: string; // Pending, Approved, Rejected
  items: PurchaseRequestItem[];
  totalAmount?: number;
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}