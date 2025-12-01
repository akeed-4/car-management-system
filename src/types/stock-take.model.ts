import { StockTakeItem } from './stock-take-item.model';

export interface StockTake {
  id: number;
  name: string;
  date: string;
  user: string;
  status: 'Pending' | 'Approved';
  items: StockTakeItem[];
}