import { Customer } from './customer.model';
import { Car } from './car.model';

export interface QuotationItem {
  id?: number;
  carId: number;
  car?: Car;
  carDescription: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  lineTotal: number;
  deliveryPeriod?: string;
  notes?: string;
}

export interface Quotation {
  id?: number;
  quotationNumber: string;
  customerId: number;
  customer?: Customer;
  quotationDate: string;
  validityPeriod: string;
  currency: string;
  paymentTerms?: string;
  status: string; // Draft, Submitted, Accepted, Rejected
  items: QuotationItem[];
  totalAmount: number;
  notes?: string;
  linkedSalesRequestId?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
