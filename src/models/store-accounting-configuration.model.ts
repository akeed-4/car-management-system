export interface StoreAccountingConfiguration {
  id: number;
  storeId: number;
  storeName: string;
  inventoryAccountId: number;
  inventoryAccountCode: string;
  cogsAccountId: number;
  cogsAccountCode: string;
  inventoryAdjustmentAccountId: number;
  inventoryAdjustmentAccountCode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateStoreAccountingConfigurationDto {
  storeId: number;
  inventoryAccountId: number;
  cogsAccountId: number;
  inventoryAdjustmentAccountId: number;
  isActive: boolean;
}

export interface UpdateStoreAccountingConfigurationDto {
  inventoryAccountId: number;
  cogsAccountId: number;
  inventoryAdjustmentAccountId: number;
  isActive: boolean;
}
