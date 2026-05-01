import { Customer } from './customer.model';

export interface SalesRequestItem {
  id?: number;
  carDescription: string;
  quantity: number;
  requestedPrice: number;
  notes?: string;
  lineTotal?: number;
}

export interface SalesRequest {
  id?: number;
  requestNumber: string;
  requestDate: string;
  customerId: number;
  customer?: Customer;
  descriptionAr?: string;
  descriptionEn?: string;
  referenceNumber?: string;
  status?: string; // Pending, Approved, Rejected
  items: SalesRequestItem[];
  totalAmount?: number;
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}