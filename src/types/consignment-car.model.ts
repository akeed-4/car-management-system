
export type ConsignmentCarStatus = 'Available' | 'Sold' | 'Returned to Owner';

export interface ConsignmentCar {
  id: number;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  mileage: number;
  ownerName: string;
  ownerPhone: string;
  agreedSalePrice: number; // Price agreed with owner
  commissionRate: number; // e.g., 0.05 for 5%
  status: ConsignmentCarStatus;
  dateReceived: string; // YYYY-MM-DD
  dateSold?: string; // YYYY-MM-DD
  salePrice?: number; // Actual sale price
  commissionAmount?: number;
  ownerPayout?: number;
  notes?: string;
  isArchived?: boolean;
}
