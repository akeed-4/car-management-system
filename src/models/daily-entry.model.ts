export type DailyEntryType = 'Receiving' | 'Delivery' | 'Transfer' | 'Return' | 'Inspection' | 'Maintenance';
export type DailyEntryStatus = 'Pending' | 'Completed' | 'Cancelled';

export interface DailyEntry {
  id: number;
  referenceNumber: string;
  entryType: DailyEntryType;

  carId: number;
  carDescription: string;
  carVin?: string;

  storeId?: number | null;
  storeName?: string | null;

  employeeId: number;
  employeeName: string;

  entryDate: string;
  status: DailyEntryStatus;
  remarks?: string;

  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateDailyEntryDto {
  entryType: DailyEntryType;
  carId: number;
  storeId?: number | null;
  employeeId: number;
  entryDate: string;
  status: DailyEntryStatus;
  remarks?: string;
  createdBy: number;
}

export interface UpdateDailyEntryDto {
  entryType?: DailyEntryType;
  carId?: number;
  storeId?: number | null;
  employeeId?: number;
  entryDate?: string;
  status?: DailyEntryStatus;
  remarks?: string;
}
