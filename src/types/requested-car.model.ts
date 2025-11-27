export type RequestedCarStatus = 'New' | 'Contacted' | 'Sourced' | 'Closed';

export interface RequestedCar {
  id: number;
  requestDate: string;
  customerName: string;
  customerPhone: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  notes?: string;
  status: RequestedCarStatus;
}
