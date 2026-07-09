export type PurchaseRequisitionStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'PartiallyConverted'
  | 'FullyConverted';

export interface PurchaseRequisitionItemDto {
  id: number;
  itemCode?: string;
  itemDescription: string;
  unitOfMeasure: string;
  requestedQuantity: number;
  quotedQuantity: number;
  remainingQuantity: number;
  standardBasePrice: number;
  notes?: string;
}

export interface PurchaseRequisitionDto {
  id: number;
  requisitionNumber: string;
  requisitionDate: string;
  requesterId?: number;
  departmentName?: string;
  status: PurchaseRequisitionStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items: PurchaseRequisitionItemDto[];
}

export interface CreatePurchaseRequisitionItemDto {
  itemCode?: string;
  itemDescription: string;
  unitOfMeasure: string;
  requestedQuantity: number;
  standardBasePrice: number;
  notes?: string;
}

export interface CreatePurchaseRequisitionDto {
  requisitionNumber: string;
  requisitionDate: Date | string;
  requesterId?: number;
  departmentName?: string;
  notes?: string;
  items: CreatePurchaseRequisitionItemDto[];
}

export interface UpdatePurchaseRequisitionDto {
  requisitionNumber?: string;
  requisitionDate?: Date | string;
  departmentName?: string;
  status?: PurchaseRequisitionStatus;
  notes?: string;
}
