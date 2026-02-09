export type CarStatus = 'Available' | 'Reserved' | 'Sold' | 'In Maintenance';
export type CarLocation = string;
export type CarCondition = 'New' | 'Used';

export interface Car {
  imageUrl: string;
  createdAt: any;
  id: number;
  vin: string;
  plateNumber: string;
  istimaraExpiry: string; // Date string e.g., '2025-12-31'
  fahasStatus: 'Valid' | 'Expired' | 'Not Required';
  make: string;
  model: string;
  year: number;
  condition: CarCondition; // New property
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  transmission: 'Automatic' | 'Manual';
  engineSize: string; // e.g., '2.5L V6'
  status: CarStatus;
  currentLocation: CarLocation;
  photos: string[];
  purchasePrice: number;
  additionalCosts: number;
  totalCost: number; // This will now represent the true total cost including linked expenses
  salePrice: number;
  description: string;
  purchaseDate?: string; // e.g., '2024-05-20'
  floorPlanId?: number;
  isArchived?: boolean;
  quantity: number; // Current quantity in inventory

  // New fields
  carType?: string;
  transportationType?: 'Private' | 'Public' | 'Taxi';
  chassisNumber?: string;
  ownerName?: string;
  ownerIdNumber?: string;
  ownerPhone?: string;
  authorizedSellerName?: string;
  authorizedSellerIdNumber?: string;
  authorizedSellerPhone?: string;
  authorizationDocumentNumber?: string;
  authorizationDocumentDate?: string;
  authorizationDocumentAttachment?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  buyerName?: string;
  buyerIdNumber?: string;
  buyerPhone?: string;
  showroomCommission?: number;
  floorFees?: number;
  costCenter?: string;
  documentImages?: string[];
  allowEntryToShowroom?: boolean;
  trackByBatch?: boolean;
}

