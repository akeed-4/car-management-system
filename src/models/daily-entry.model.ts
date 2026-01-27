export type DailyEntryType = 'maintenance' | 'ownership_transfer' | 'insurance' | 'periodic_inspection';

export interface BaseDailyEntry {
  id: number;
  carId: number;
  entryType: DailyEntryType;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface MaintenanceEntry extends BaseDailyEntry {
  entryType: 'maintenance';
  maintenanceType: string;
  cost: number;
  performedBy: string;
  nextMaintenanceDate?: string;
  partsReplaced?: string[];
  mileage?: number;
}

export interface OwnershipTransferEntry extends BaseDailyEntry {
  entryType: 'ownership_transfer';
  previousOwnerName: string;
  previousOwnerId: string;
  newOwnerName: string;
  newOwnerId: string;
  transferAmount: number;
  transferDocumentNumber: string;
  transferDate: string;
}

export interface InsuranceEntry extends BaseDailyEntry {
  entryType: 'insurance';
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount: number;
  premiumAmount: number;
  startDate: string;
  endDate: string;
  insuranceType: 'comprehensive' | 'third_party' | 'personal_accident';
}

export interface PeriodicInspectionEntry extends BaseDailyEntry {
  entryType: 'periodic_inspection';
  inspectionCenter: string;
  inspectionResult: 'passed' | 'failed' | 'conditional';
  inspectionDate: string;
  expiryDate: string;
  inspectorName: string;
  violations?: string[];
  recommendations?: string[];
}

export type DailyEntry = MaintenanceEntry | OwnershipTransferEntry | InsuranceEntry | PeriodicInspectionEntry;