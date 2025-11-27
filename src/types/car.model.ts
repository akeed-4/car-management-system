export type CarStatus = 'Available' | 'Reserved' | 'Sold' | 'In Maintenance';

export interface Car {
  id: number;
  vin: string;
  plateNumber: string;
  istimaraExpiry: string; // Date string e.g., '2025-12-31'
  fahasStatus: 'Valid' | 'Expired' | 'Not Required';
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  transmission: 'Automatic' | 'Manual';
  engineSize: string; // e.g., '2.5L V6'
  status: CarStatus;
  photos: string[];
  purchasePrice: number;
  additionalCosts: number;
  totalCost: number;
  salePrice: number;
  description: string;
  // Fix: Removed quantity from Car interface. It's now tracked via InventoryService's carQuantities map
  // and in InvoiceItem/StockTakeItem for specific transactions.
}