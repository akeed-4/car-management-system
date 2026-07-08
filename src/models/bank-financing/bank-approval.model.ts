export interface BankApproval {
  id?: number;
  quotationId: number;
  lpoReference: string;
  approvedFinancingAmount: number;
  approvalDate: string;
  notes?: string;
}

export interface CreateBankApprovalDto {
  quotationId: number;
  lpoReference: string;
  approvedFinancingAmount: number;
  approvalDate: string;
  notes?: string;
}
