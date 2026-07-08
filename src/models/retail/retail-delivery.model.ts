export interface VehicleSpecs {
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  engineNumber: string;
  transmission: string;
}

export interface GatePassChecklistData {
  gatePassSerial: string;
  keysConfirmed: boolean;
  spareTireConfirmed: boolean;
  ownerManualConfirmed: boolean;
  notes?: string;
}

export type RetailDeliveryStatus = 'Pending' | 'ReadyForHandover' | 'Delivered' | 'Canceled';

export interface RetailDelivery {
  id?: number;
  invoiceId: number;
  car: VehicleSpecs;
  checklist: GatePassChecklistData;
  status: RetailDeliveryStatus;
  deliveredAt?: string;
}

export interface CreateRetailDeliveryDto {
  invoiceId: number;
  checklist: GatePassChecklistData;
}
