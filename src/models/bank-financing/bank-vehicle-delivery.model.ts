/** Row for the "Approved Sales Order" lookup: Bank_Approved quotations not yet delivered. */
export interface BankOrderLookup {
  id: number;
  quotationNumber: string;
  endUserName: string;
  bankName: string;
  carDescription: string;
  vehiclePrice: number;
  approvedAt?: string;
}

/** A vehicle line on the order with ordered/delivered/remaining quantities. */
export interface BankOrderVehicleLine {
  carId: number;
  vin: string;
  carDescription: string;
  unitPrice: number;
  orderedQuantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
}

/** Full detail auto-loaded once an approved order is selected on the delivery screen. */
export interface BankOrderDeliveryDetails {
  bankQuotationId: number;
  quotationNumber: string;
  status: string;

  endUserName: string;
  endUserMobile: string;
  endUserNationalId: string;

  bankId: number;
  bankName: string;
  bankLpoReference?: string;
  approvedFinancingAmount?: number;
  downPayment?: number;

  vehicles: BankOrderVehicleLine[];
}

export interface CreateBankVehicleDeliveryItemDto {
  carId: number;
  deliveredQuantity: number;
}

export interface CreateBankVehicleDeliveryDto {
  bankQuotationId: number;
  receiverName: string;
  receiverNationalId?: string;
  receiverPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
  userId: number;
  items: CreateBankVehicleDeliveryItemDto[];
}

export interface CreateBankInvoiceFromDeliveryDto {
  deliveryNoteId: number;
  bankBillingCustomerId: number;
  issuedPlateNumber: string;
  debitAccountId?: number;
  creditAccountId?: number;
  userId: number;
}

export interface BankVehicleDelivery {
  id: number;
  deliveryNumber: string;
  bankQuotationId: number;
  quotationNumber: string;
  endUserName: string;
  bankName: string;
  carId: number;
  vin: string;
  carDescription: string;
  deliveryDate: string;
  receiverName: string;
  receiverNationalId?: string;
  receiverPhone?: string;
  driverName?: string;
  signatureData?: string;
  checklistJson?: string;
  notes?: string;
}
