import { StockTakeItem } from "./stock-take-item.model";

export interface StockTakeApproval {
  id: number;
  date: string;
  Name: string;
  stockTakeId: number;
  stockTakeName: string;
  status: string;
  storeId: number;
  notes: string;
  items?: StockTakeItem[];
}