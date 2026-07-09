import { Supplier } from './supplier.model';

export type SupplierRfqStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface SupplierRfqItemDto {
  id: number;
  purchaseRequisitionItemId: number;
  itemDescription: string;
  quotedQuantity: number;
  standardBasePrice: number;
  quotedUnitPrice: number;
  lineTotal: number;
}

export interface SupplierRfqDto {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  vendorId: number;
  vendorName: string;
  vendor?: Supplier;
  purchaseRequisitionId: number;
  requisitionNumber: string;
  status: SupplierRfqStatus;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  items: SupplierRfqItemDto[];
}

export interface CreateSupplierRfqItemDto {
  purchaseRequisitionItemId: number;
  quotedQuantity: number;
  quotedUnitPrice: number;
}

export interface CreateSupplierRfqDto {
  quotationNumber: string;
  quotationDate: Date | string;
  vendorId: number;
  purchaseRequisitionId: number;
  validUntil?: Date | string;
  notes?: string;
  items: CreateSupplierRfqItemDto[];
}

export interface UpdateSupplierRfqDto {
  status?: SupplierRfqStatus;
  notes?: string;
  items?: CreateSupplierRfqItemDto[];
}

/** Cascading dropdown row: pending Purchase Requisitions eligible for quoting by a vendor. */
export interface PendingRequisitionLookupDto {
  id: number;
  requisitionNumber: string;
  requisitionDate: string;
  status: string;
  eligibleLineCount: number;
}

/** Row shape used to auto-populate the quotation grid once a PR is selected. */
export interface RequisitionItemForQuoteDto {
  purchaseRequisitionItemId: number;
  itemCode?: string;
  itemDescription: string;
  unitOfMeasure: string;
  remainingQuantity: number;
  standardBasePrice: number;
}
