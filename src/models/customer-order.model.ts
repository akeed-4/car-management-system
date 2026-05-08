export interface CustomerOrder {
  id?: number;
  orderNumber: string;
  customerId: number;
  vehicleId: number;
  salesperson?: string;
  storeId?: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  createdDate: string;
  lastUpdated: string;
}