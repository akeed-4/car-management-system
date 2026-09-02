export type CarStatus = 'Available' | 'Reserved' | 'Sold' | 'In Maintenance' | 'Offered';
export type CarLocation = string;
export type CarCondition = 'New' | 'Used';

export interface Car {
  imageUrl: string;
  createdAt: any;
  id: number;
  /** Stable, non-sequential public identifier for the QR code / public vehicle page -- never the
   *  internal id. See PublicVehiclesController on the backend. */
  publicId?: string;
  vin: string;
  plateNumber: string;
  istimaraExpiry: string; // Date string e.g., '2025-12-31'
  fahasStatus: 'Valid' | 'Expired' | 'Not Required';
  make: string;
  model: string;
  year: number;
  manufacturerId?: number | null;
  modelId?: number | null;
  /** The Trim + Model Year technical specification this vehicle was created from -- see
   *  YearSpecification. Read-only technical-spec fields below are sourced from it. */
  yearSpecificationId?: number | null;
  engineType?: string;
  engineCapacity?: string;
  cylinderCount?: number | null;
  horsepower?: number | null;
  fuelType?: string;
  driveType?: string;
  standardAgencyPrice?: number | null;
  condition: CarCondition; // New property
  exteriorColor: string;
  interiorColor: string;
  /** Requirement 8: preferred over the free-text exteriorColor/interiorColor above -- the Vehicle
   * Card's color fields are dropdowns backed by the VehicleColor dictionary. */
  exteriorColorId?: number | null;
  interiorColorId?: number | null;
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
  calculateVATFromProfitMargin?: boolean;
  description: string;
  purchaseDate?: string; // e.g., '2024-05-20'
  floorPlanId?: number;
  isArchived?: boolean;
  quantity: number; // Current quantity in inventory
  categoryId?: number;
  chassisNumber?: string;
  ownerName?: string;
  ownerIdNumber?: string;
  ownerPhone?: string;
  authorizedSellerName?: string;
  authorizedSellerIdNumber?: string;
  authorizedSellerPhone?: string;
  authorizationDocumentNumber?: string;
  carType?: string;
  transportationType?: string;
  customerId?: number;
  customerName?: string;
  trackByBatch?: boolean;
  /** Store this car's initial stock is received into -- required to make it reservable via
   *  quantity-based checks. Create-time only: CreateCarDto carries it, UpdateCarDto does not (the
   *  backend has no Car.StoreId column; it's consumed once to create a StoreCarStock row). */
  storeId?: number | null;
  /** Initial StoreCarStock quantity when storeId is set. Defaults to 1 server-side. Create-time only. */
  initialQuantity?: number | null;
}

