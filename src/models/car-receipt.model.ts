import { Supplier } from './supplier.model';

export interface CarReceiptItem {
  id: number;
  vin: string;
  carId: number;
  carDescription: string;
  unitPrice: number;
  quantity: number;
  /** Running total invoiced across all purchase invoices for this line. */
  invoicedQuantity: number;
  /** quantity - invoicedQuantity -- the amount still eligible to invoice. */
  remainingToInvoice: number;
}

export interface CarReceipt {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  supplierId: number;
  supplierName: string;
  purchaseOfferId?: number;
  status: string;
  notes?: string;
  createdAt: string;
  items: CarReceiptItem[];
}

export interface CreateCarReceiptItemDto {
  vin: string;
  carId: number;
  carDescription: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateCarReceiptDto {
  receiptNumber: string;
  receiptDate: Date | string;
  supplierId: number;
  purchaseOfferId?: number;
  notes?: string;
  items: CreateCarReceiptItemDto[];
}
