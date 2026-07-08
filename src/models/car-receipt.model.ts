import { Supplier } from './supplier.model';
import { Car } from './car.model';
import { PoDto } from './purchase-order.model';

export interface CarReceipt {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  supplierId: number;
  supplier?: Supplier;
  purchaseOrderId: number; // mandatory -- a GRN is always created from a Purchase Order
  purchaseOrder?: PoDto;
  notes?: string;
  isArchived?: boolean;
  isInvoiced?: boolean;
  invoiceId?: number;
  createdAt?: string;
  updatedAt?: string;
  carReceiptItems: CarReceiptItem[];
}

/** One physical unit (VIN) received against a CarReceiptItem line. */
export interface CarReceiptUnit {
  id?: number;
  vin: string;
  color?: string;
  engineNumber?: string;
}

export interface CarReceiptItem {
  id: number;
  carReceiptId: number;
  carId: number;
  car?: Car;
  receivedQuantity: number;
  unitCost: number;
  notes?: string;
  units?: CarReceiptUnit[];
}

export interface CreateCarReceiptItemDto {
  carId: number;
  receivedQuantity: number;
  unitCost: number;
  units?: CarReceiptUnit[];
}

export interface CreateCarReceiptDto {
  receiptNumber: string;
  purchaseOrderId: number;
  receiptDate: Date | string;
  notes?: string;
  carReceiptItems: CreateCarReceiptItemDto[];
}
