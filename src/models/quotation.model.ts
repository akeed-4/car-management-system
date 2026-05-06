export interface Quotation {
  id?: number;
  orderNumber: string;
  customerId: number;
  carId: number;
  salesperson?: string;
  storeId?: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  createdDate: string;
  lastUpdated: string;
}