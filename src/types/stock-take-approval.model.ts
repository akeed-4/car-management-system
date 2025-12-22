export interface StockTakeApproval {
  id: number;
  date: string;
  approverName: string;
  stockTakeId: number;
  stockTakeName: string;
  status: string;
  notes: string;
}