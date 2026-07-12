export type DeliveryStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';

export interface DeliverySchedule {
  id: number;
  deliveryNumber: string;

  salesInvoiceId?: number | null;
  salesInvoiceNumber?: string | null;

  customerId: number;
  customerName: string;
  customerPhone: string;

  carId: number;
  carDescription: string;
  carVin?: string;

  driverId?: number | null;
  driverName?: string | null;

  deliveryDate: string;
  deliveryTime?: string;

  branchId?: number | null;
  branchName?: string | null;

  status: DeliveryStatus;

  documentsReady: boolean;
  insuranceReady: boolean;
  registrationReady: boolean;
  customerConfirmed: boolean;

  deliveryProgress: number;

  notes?: string;

  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateDeliveryScheduleDto {
  salesInvoiceId?: number | null;
  customerId: number;
  carId: number;
  driverId?: number | null;
  deliveryDate: string;
  deliveryTime?: string;
  branchId?: number | null;
  documentsReady: boolean;
  insuranceReady: boolean;
  registrationReady: boolean;
  customerConfirmed: boolean;
  notes?: string;
  createdBy: number;
}

export interface UpdateDeliveryScheduleDto {
  salesInvoiceId?: number | null;
  customerId?: number;
  carId?: number;
  driverId?: number | null;
  deliveryDate?: string;
  deliveryTime?: string;
  branchId?: number | null;
  status?: DeliveryStatus;
  documentsReady?: boolean;
  insuranceReady?: boolean;
  registrationReady?: boolean;
  customerConfirmed?: boolean;
  notes?: string;
}
