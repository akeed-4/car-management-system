export interface StoreTransferItem {
  id: number;
  carId: number;
  carDescription: string;
  quantity: number;
}

export interface StoreTransfer {
  id: number;
  transferNumber: string;
  transferDate: string;
  fromStoreId: number;
  fromStoreName: string;
  toStoreId: number;
  toStoreName: string;
  status: string;
  notes?: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
  approvedBy?: number | null;
  approvedDate?: string | null;
  items: StoreTransferItem[];
}

export interface CreateStoreTransferItemDto {
  carId: number;
  quantity: number;
}

export interface CreateStoreTransferDto {
  transferDate: string;
  fromStoreId: number;
  toStoreId: number;
  notes?: string | null;
  items: CreateStoreTransferItemDto[];
}
