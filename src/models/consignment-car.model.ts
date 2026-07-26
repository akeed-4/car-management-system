export type ConsignmentCarStatus = 'Available' | 'Reserved' | 'Sold' | 'Returned';
export type CommissionType = 'Percentage' | 'FixedAmount';

export interface ConsignmentCar {
  id: number;
  consignmentNumber: string;

  supplierId: number;
  supplierName: string;
  supplierPhone: string;

  make: string;
  model: string;
  year?: number;
  exteriorColor?: string;
  vin: string;
  engineNumber?: string;
  plateNumber?: string;
  mileage?: number;

  arrivalDate: string;
  expectedSalePrice: number;
  currentCost: number;
  commissionType: CommissionType;
  commissionRate: number;
  commissionFixedAmount: number;
  /** Preview only, recalculated off expectedSalePrice -- the posted amount lives on ConsignmentSale.commissionAmount. */
  commissionAmount?: number;

  status: ConsignmentCarStatus;
  location?: string;

  soldDate?: string | null;
  actualSalePrice?: number | null;

  notes?: string;

  companyId?: number | null;
  branchId?: number | null;

  daysInStock: number;

  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateConsignmentCarDto {
  supplierId: number;
  make: string;
  model: string;
  year?: number;
  exteriorColor?: string;
  vin: string;
  engineNumber?: string;
  plateNumber?: string;
  mileage?: number;
  arrivalDate: string;
  expectedSalePrice: number;
  currentCost: number;
  commissionType?: CommissionType;
  commissionRate: number;
  commissionFixedAmount?: number;
  location?: string;
  notes?: string;
  companyId?: number | null;
  branchId?: number | null;
  createdBy: number;
}

export interface UpdateConsignmentCarDto {
  supplierId?: number;
  make?: string;
  model?: string;
  year?: number;
  exteriorColor?: string;
  vin?: string;
  engineNumber?: string;
  plateNumber?: string;
  mileage?: number;
  arrivalDate?: string;
  expectedSalePrice?: number;
  currentCost?: number;
  commissionType?: CommissionType;
  commissionRate?: number;
  commissionFixedAmount?: number;
  /** "Sold" is rejected by the backend here -- selling must go through ConsignmentSaleService.sell(). */
  status?: ConsignmentCarStatus;
  location?: string;
  notes?: string;
  companyId?: number | null;
  branchId?: number | null;
}
