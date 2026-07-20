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

  /** Set when this request references a real inventory vehicle (selected via the vehicle-lookup
   * popup); null for free-text wishlist requests describing a car not currently in stock. */
  carId?: number | null;
  carVin?: string | null;
  carPlateNumber?: string | null;

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
  carId?: number | null;
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
  carId?: number | null;
  /** Explicit flag distinguishing "clear the vehicle link" (true) from "leave carId unchanged"
   * (false/omitted) -- carId being undefined does not mean "no change" once this is set. */
  clearCarId?: boolean;
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
