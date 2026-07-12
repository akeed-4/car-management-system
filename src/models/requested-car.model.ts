export type RequestedCarStatus = 'New' | 'Contacted' | 'Sourced' | 'Closed';
export type RequestedCarPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type ReservationStatus = 'NotReserved' | 'Reserved' | 'Confirmed';

export interface RequestedCar {
  id: number;
  requestNumber: string;
  requestDate: string;

  customerId: number;
  customerName: string;
  customerPhone: string;

  salespersonId?: number | null;
  salespersonName?: string | null;

  make: string;
  model: string;
  year?: number;
  color?: string;
  preferredSpecifications?: string;

  priority: RequestedCarPriority;
  expectedArrival?: string | null;
  reservationStatus: ReservationStatus;

  notes?: string;
  status: RequestedCarStatus;

  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateRequestedCarDto {
  requestDate: string;
  customerId: number;
  salespersonId?: number | null;
  make: string;
  model: string;
  year?: number;
  color?: string;
  preferredSpecifications?: string;
  priority: RequestedCarPriority;
  expectedArrival?: string | null;
  reservationStatus: ReservationStatus;
  notes?: string;
  createdBy: number;
}

export interface UpdateRequestedCarDto {
  requestDate?: string;
  customerId?: number;
  salespersonId?: number | null;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  preferredSpecifications?: string;
  priority?: RequestedCarPriority;
  expectedArrival?: string | null;
  reservationStatus?: ReservationStatus;
  notes?: string;
  status?: RequestedCarStatus;
}
