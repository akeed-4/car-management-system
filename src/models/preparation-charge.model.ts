export interface PreparationCharge {
  id?: number;
  vehicleId: number;
  itemName: string;
  price: number;
  status: 'Pending' | 'Applied';
  createdDate: string;
  appliedDate?: string;
}