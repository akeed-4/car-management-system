export interface BankPartner {
  id: number;
  name: string;
}

export type BankQuotationStatus = 'Locked' | 'Bank_Approved' | 'Finalized' | 'Expired' | 'Cancelled';

export interface BankQuotation {
  id: number;
  quotationNumber: string;
  endUserName: string;
  endUserMobile: string;
  endUserNationalId: string;
  bankId: number;
  bankName: string;
  carId: number;
  vin: string;
  carDescription: string;
  vehiclePrice: number;
  lockExpiresAt: string;
  status: BankQuotationStatus;
  bankLpoReference?: string;
  approvedFinancingAmount?: number;
  downPayment?: number;
  installmentCount?: number;
  installmentTermMonths?: number;
  approvalNotes?: string;
  approvedAt?: string;
}

export interface CreateBankQuotationDto {
  endUserName: string;
  endUserMobile: string;
  endUserNationalId: string;
  bankId: number;
  carId: number;
  userId: number;
}
