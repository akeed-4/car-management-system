import { Supplier } from './supplier.model';
import { PurchaseOffer } from './purchase-offer.model';
import { Car } from './car.model';

export interface CarReceipt {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  supplierId: number;
  supplier?: Supplier;
  purchaseOfferId?: number;
  purchaseOffer?: PurchaseOffer;
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  carReceiptItems: CarReceiptItem[];
}

export interface CarReceiptItem {
  id: number;
  carReceiptId: number;
  carId: number;
  car?: Car;
  receivedQuantity: number;
  notes?: string;
}