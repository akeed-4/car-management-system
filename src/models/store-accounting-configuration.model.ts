export type InventoryAccountingMethod = 'Perpetual' | 'Periodic';

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
  /** Default absorption account for a capitalized Additional Cost when the document doesn't
   *  specify its own debit account -- falls back to inventoryAccountId when unset. */
  additionalCostAccountId?: number | null;
  additionalCostAccountCode?: string | null;
  /** Default expense account for an Additional Cost marked NOT capitalized, when no more
   *  specific category account (Freight/Customs) is configured. */
  purchaseExpenseAccountId?: number | null;
  purchaseExpenseAccountCode?: string | null;
  /** Expense-side account for Freight/Shipping costs -- only used when the cost is expensed,
   *  not capitalized. */
  freightShippingAccountId?: number | null;
  freightShippingAccountCode?: string | null;
  /** Expense-side account for Customs costs -- only used when the cost is expensed. */
  customsAccountId?: number | null;
  customsAccountCode?: string | null;
  /** Offsetting credit account for an Inventory Opening Balance entry (Dr Inventory / Cr this
   *  account) -- e.g. "Retained Earnings" or an "Opening Balance Equity" account. */
  openingBalanceEquityAccountId?: number | null;
  openingBalanceEquityAccountCode?: string | null;
  /** Perpetual (default): Purchase debits Inventory, a sale immediately posts Dr COGS / Cr
   *  Inventory. Periodic: Purchase debits purchaseExpenseAccountId instead, sales post no COGS
   *  entry, and inventory value is adjusted only via period-end closing. */
  inventoryAccountingMethod: InventoryAccountingMethod;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateStoreAccountingConfigurationDto {
  storeId: number;
  inventoryAccountId: number;
  cogsAccountId: number;
  inventoryAdjustmentAccountId: number;
  additionalCostAccountId?: number | null;
  purchaseExpenseAccountId?: number | null;
  freightShippingAccountId?: number | null;
  customsAccountId?: number | null;
  openingBalanceEquityAccountId?: number | null;
  inventoryAccountingMethod: InventoryAccountingMethod;
  isActive: boolean;
}

export interface UpdateStoreAccountingConfigurationDto {
  inventoryAccountId: number;
  cogsAccountId: number;
  inventoryAdjustmentAccountId: number;
  additionalCostAccountId?: number | null;
  purchaseExpenseAccountId?: number | null;
  freightShippingAccountId?: number | null;
  customsAccountId?: number | null;
  openingBalanceEquityAccountId?: number | null;
  inventoryAccountingMethod: InventoryAccountingMethod;
  isActive: boolean;
}
