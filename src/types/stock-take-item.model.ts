export interface StockTakeItem {
  itemId: number;
  itemName: string;
  category: string;
  quantityCounted: number;
  unitCost: number;
  totalCost: number;
  notes: string;
}