export interface StockTakeItem {
  itemId: number;
  itemName: string;
  category: string;
  systemQuantity?: number;
  quantityCounted: number;
  unitCost: number;
  totalCost: number;
  notes: string;
}