import { Car } from './car.model';

export interface Customer {
  id: number;
  name: string;
  // Add other customer fields as needed
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  quotationDate: string;
  customerId: number;
  customer?: Customer;
  carId: number;
  car?: Car;
  quotedPrice: number;
  terms?: string;
  status: string; // Pending, Accepted, Rejected
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}