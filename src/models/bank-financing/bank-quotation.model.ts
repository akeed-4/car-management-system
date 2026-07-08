export interface BankPartner {
  id: number;
  name: string;
  isVerified: boolean;
}

export interface VinLockCandidate {
  carId: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  salePrice: number;
  status: string; // 'Available' | 'Reserved' | ...
}

export type BankQuotationStatus = 'Draft' | 'Reserved_Bank_Pending' | 'BankApproved' | 'BankRejected' | 'Cancelled';

export interface BankQuotationCustomerInfo {
  name: string;
  mobile: string;
  nationalId: string;
}

export interface BankQuotation {
  id?: number;
  quotationNumber?: string;
  quotationDate: string;
  customer: BankQuotationCustomerInfo;
  bankId: number;
  bankName?: string;
  carId: number;
  vin?: string;
  vehiclePrice: number;
  status: BankQuotationStatus;
  vinLockExpiresAt?: string; // 72-hour inventory hold expiry
  notes?: string;
}

export interface CreateBankQuotationDto {
  quotationDate: string;
  customer: BankQuotationCustomerInfo;
  bankId: number;
  carId: number;
  vehiclePrice: number;
  notes?: string;
}
