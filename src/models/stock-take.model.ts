import { StockTakeItem } from './stock-take-item.model';

export interface StockTake {
  id: number;
  documentName: string;
  documentDate: string;
  storeId: number;
  createdBy: string;
  notes: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  items: StockTakeItem[];
  /** Stored override for the gain/loss adjustment posting's Inventory leg, or null/undefined when
   *  the Store's configured default is used. See AccountingService.resolveDefaultAccount /
   *  DefaultAccountKind.StockAdjustmentInventory. */
  inventoryAccountId?: number | null;
  /** Stored override for the adjustment posting's gain/loss leg, or null/undefined when the
   *  Store's configured default is used. See DefaultAccountKind.StockAdjustmentGainLoss. */
  inventoryAdjustmentAccountId?: number | null;
}