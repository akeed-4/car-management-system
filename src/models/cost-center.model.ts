export interface CostCenter {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  carId?: number;
  carVin?: string;
  carInfo?: string;
  parentId?: number;
  parentName?: string;
  isActive: boolean;
  totalCosts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCenterEntry {
  id: number;
  costCenterId: number;
  costCenterName: string;
  entryDate: Date;
  description: string;
  costType: 'Maintenance' | 'Ownership Transfer' | 'Processing Fees' | 'Periodic Inspection' | 'Insurance' | 'Storage' | 'Other';
  amount: number;
  referenceNumber?: string;
  documentUrl?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCostCenterDto {
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  carId?: number;
  parentId?: number;
  isActive: boolean;
}

export interface UpdateCostCenterDto {
  id: number;
  code: string;
  name: string;
  nameAr: string;
  description?: string;
  carId?: number;
  parentId?: number;
  isActive: boolean;
}

export interface CreateCostCenterEntryDto {
  costCenterId: number;
  entryDate: Date;
  description: string;
  costType: 'Maintenance' | 'Ownership Transfer' | 'Processing Fees' | 'Periodic Inspection' | 'Insurance' | 'Storage' | 'Other';
  amount: number;
  referenceNumber?: string;
  documentUrl?: string;
  notes?: string;
}
