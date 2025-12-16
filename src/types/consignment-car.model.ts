
export type ConsignmentCarStatus = 'Available' | 'Sold' | 'Returned to Owner';

export interface ConsignmentCar {
  id: number;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  carType?: string;
  transmissionType?: 'Private' | 'Public' | 'Taxi';
  chassisNumber?: string;
  exteriorColor: string;
  mileage: number;
  ownerName: string;
  ownerIdNumber?: string;
  ownerPhone: string;
  authorizedSellerName?: string;
  authorizedSellerIdNumber?: string;
  authorizationDocumentNumber?: string;
  authorizationDocumentDate?: string;
  authorizationDocumentAttachment?: string;
  documentImages?: string[];
  agreedSalePrice: number; // Price agreed with owner
  commissionRate: number; // e.g., 0.05 for 5%
  status: ConsignmentCarStatus;
  dateReceived: string; // YYYY-MM-DD
  dateSold?: string; // YYYY-MM-DD
  salePrice?: number; // Actual sale price
  commissionAmount?: number;
  ownerPayout?: number;

  // Sales features
  isForSale?: boolean; // Flag to indicate if this is for sale (not just consignment)
  exhibitionFee?: number; // Fee for displaying the car
  buyerName?: string;
  buyerIdNumber?: string;
  buyerPhone?: string;

  // Sale Options
  saleOptions?: {
    net: boolean;
    withInsurance: boolean;
    withInspection: boolean;
    withDelivery: boolean;
    withFollowUp: boolean;
  };

  // Calculated prices based on options
  insuranceCost?: number;
  inspectionCost?: number;
  deliveryCost?: number;
  followUpCost?: number;
  totalSalePrice?: number; // Final price including all options

  // Payment details
  carPricePaid?: boolean;
  exhibitionFeePaid?: boolean;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;

  notes?: string;
  isArchived?: boolean;
}
