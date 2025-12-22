import { StockTakeItem } from './stock-take-item.model';

export interface StockTake {
  id: number;
  documentCode: string;
  documentDate: string;
  createdBy: string;
  notes: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  items: StockTakeItem[];
}