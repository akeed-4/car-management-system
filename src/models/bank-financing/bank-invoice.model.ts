export interface BillToParty {
  role: 'Funder';
  bankName: string;
  bankAccountNumber: string;
  lpoReference: string;
  financedAmount: number;
}

export interface OwnerParty {
  role: 'EndUser';
  customerName: string;
  nationalId: string;
  downPaymentAmount: number;
}

export interface SplitBillingSummary {
  billTo: BillToParty;
  owner: OwnerParty;
  vehiclePrice: number;
  zatcaTax: number;
  totalAmount: number;
}

export interface GovRegistrationDetails {
  licensePlateNumber: string;
  registrationSequenceCode: string;
  registrationDate: string;
  issuingAuthority?: string;
}

export interface BankInvoice {
  id?: number;
  invoiceNumber?: string;
  approvalId: number;
  billing: SplitBillingSummary;
  registration: GovRegistrationDetails;
  status?: 'Draft' | 'Finalized';
}

export interface FinalizeBankInvoiceDto {
  approvalId: number;
  registration: GovRegistrationDetails;
}
