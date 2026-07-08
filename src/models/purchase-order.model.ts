import { Supplier } from './supplier.model';
import { Car } from './car.model';

export type PoStatus = 'Open' | 'PartiallyReceived' | 'FullyReceived' | 'Closed';

export interface CreatePoItemDto {
  carId: number;
  quantity: number;
  unitPrice: number;
}

export interface CreatePoDto {
  poNumber: string;
  poDate: Date | string;
  purchaseRequestId: number; // the approved Purchase Request this PO was created from
  notes?: string;
  items: CreatePoItemDto[];
}

export interface PoItemDto {
  id: number;
  carId: number;
  car?: Car;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  receivedQuantity?: number; // cumulative quantity already received via GRNs against this PO
}

export interface PoDto {
  id: number;
  poNumber: string;
  poDate: string;
  supplierId: number;
  supplier?: Supplier;
  purchaseRequestId: number;
  notes?: string;
  status: PoStatus;
  totalAmount: number;
  items: PoItemDto[];
  createdAt?: string;
  updatedAt?: string;
}
