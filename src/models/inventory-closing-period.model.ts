export interface InventoryClosingPeriod {
  id: number;
  storeId: number;
  periodStart: string;
  periodEnd: string;
  openingInventoryValue: number;
  purchasesTotal: number;
  capitalizedCostsTotal: number;
  closingInventoryValue: number;
  closingValueFromStockTake: boolean;
  sourceStockTakeId?: number | null;
  computedCogs: number;
  status: string;
  createdAt: string;
}

export interface CloseInventoryPeriodDto {
  storeId: number;
  periodStart: string;
  periodEnd: string;
  /** Optional override for the ending inventory valuation. When omitted, the backend uses the
   *  latest APPROVED stock take on/before periodEnd, else the store's current stock value. */
  manualClosingInventoryValue?: number | null;
}
