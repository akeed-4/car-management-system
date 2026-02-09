export interface ItemBatch {
  id?: number;
  itemId: number;
  batchNo: string;
  productionDate: Date;
  expiryDate: Date;
  quantity: number;
  availableQuantity: number;
  status: 'Active' | 'Expired' | 'Depleted';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BatchAllocation {
  batchId?: number;
  batchNo: string;
  productionDate: Date;
  expiryDate: Date;
  quantity: number;
  allocatedQuantity?: number;
}

export interface PurchaseItemBatch {
  itemId: number;
  batchAllocations: BatchAllocation[];
  totalAllocatedQuantity: number;
}