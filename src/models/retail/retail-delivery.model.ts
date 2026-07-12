export interface VehicleSpecs {
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  engineSize: string;
  transmission: string;
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
  deliveredToNationalId?: string;
  deliveredToPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
}

export interface CreateRetailDeliveryDto {
  salesInvoiceId: number;
  gatePassSerial: string;
  deliveredToName?: string;
  deliveredToNationalId?: string;
  deliveredToPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
  userId: number;
}
