export type ContractTerm = 'Net 30' | 'Net 60';

export interface POReferenceData {
  purchaseOrderReference: string;
  contractTerm: ContractTerm;
}

export interface CorporateOrder {
  id?: number;
  orderNumber?: string;
  quotationId: number;
  clientId: number;
  purchaseOrderReference: string;
  contractTerm: ContractTerm;
  totalAmount: number;
  status?: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected';
}

export interface CreateCorporateOrderDto {
  quotationId: number;
  purchaseOrderReference: string;
  contractTerm: ContractTerm;
}
