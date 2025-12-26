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
}