export type TestDriveStatus = 'Scheduled' | 'Completed' | 'Canceled';

export interface TestDrive {
  id: number;
  carId: number;
  carDescription: string;
  customerId: number;
  customerName: string;
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  salesperson: string;
  status: TestDriveStatus;
}
