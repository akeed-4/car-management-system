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

export interface RetailDelivery {
  id: number;
  deliveryNoteNumber: string;
  salesInvoiceId: number;
  carId: number;
  vin: string;
  gatePassSerial: string;
  deliveryDate: string;
  deliveredToName?: string;
}

export interface CreateRetailDeliveryDto {
  salesInvoiceId: number;
  gatePassSerial: string;
  deliveredToName?: string;
  notes?: string;
  userId: number;
}
