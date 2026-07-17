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

/** Invoices a Bank_Approved quotation directly -- the "Quotation" invoice source. */
export interface FinalizeBankInvoiceDto {
  bankQuotationId: number;
  /** The bank's billing Customer record (Bill-to / Debtor). */
  bankBillingCustomerId: number;
  issuedPlateNumber: string;
  debitAccountId: number;
  creditAccountId: number;
  userId: number;
}
