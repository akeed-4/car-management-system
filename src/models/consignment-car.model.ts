export type ConsignmentCarStatus = 'Available' | 'Reserved' | 'Sold' | 'Returned';

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
  commissionRate: number;
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
  commissionRate: number;
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
  commissionRate?: number;
  status?: ConsignmentCarStatus;
  location?: string;
  soldDate?: string | null;
  actualSalePrice?: number | null;
  notes?: string;
  companyId?: number | null;
  branchId?: number | null;
}
