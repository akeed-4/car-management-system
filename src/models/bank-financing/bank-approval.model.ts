export interface CreateBankApprovalDto {
  bankQuotationId: number;
  bankLpoReference: string;
  approvedFinancingAmount: number;
  downPayment?: number;
  installmentCount?: number;
  installmentTermMonths?: number;
  approvalNotes?: string;
  newLockExpiresAt: string;
  userId: number;
}
