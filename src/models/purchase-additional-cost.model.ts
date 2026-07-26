export type ExpenseCategory = 'Insurance' | 'Customs' | 'Shipping' | 'Freight' | 'Handling' | 'Registration' | 'Other';
export type AllocationMethod = 'Quantity' | 'Cost' | 'Weight' | 'Manual';
export type PurchaseAdditionalCostStatus = 'Draft' | 'Posted' | 'Cancelled';

export interface PurchaseAdditionalCostLine {
  id: number;
  invoiceItemId: number;
  carId: number;
  carDescription: string;
  allocationBasis: number;
  allocatedAmount: number;
}

export interface PurchaseAdditionalCost {
  id: number;
  documentNumber: string;

  purchaseInvoiceId: number;
  purchaseInvoiceNumber: string;

  costDate: string;
  expenseCategory: ExpenseCategory;
  description?: string;
  amount: number;
  allocationMethod: AllocationMethod;

  supplierId?: number | null;
  supplierName?: string | null;

  debitAccountId: number;
  debitAccountName: string;
  creditAccountId: number;
  creditAccountName: string;

  status: PurchaseAdditionalCostStatus;
  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
  postedAt?: string | null;
  cancelledAt?: string | null;

  lines: PurchaseAdditionalCostLine[];
}

export interface ManualAllocationLine {
  invoiceItemId: number;
  allocatedAmount: number;
}

export interface CreatePurchaseAdditionalCostDto {
  purchaseInvoiceId: number;
  costDate: string;
  expenseCategory: ExpenseCategory;
  description?: string;
  amount: number;
  allocationMethod: AllocationMethod;
  supplierId?: number | null;
  debitAccountId: number;
  creditAccountId: number;
  createdBy: number;
  /** Required only when allocationMethod is 'Manual'; must sum to amount. */
  manualLines?: ManualAllocationLine[];
}

export interface UpdatePurchaseAdditionalCostDto {
  costDate?: string;
  expenseCategory?: ExpenseCategory;
  description?: string;
  amount?: number;
  allocationMethod?: AllocationMethod;
  supplierId?: number | null;
  debitAccountId?: number;
  creditAccountId?: number;
  manualLines?: ManualAllocationLine[];
}

export interface AllocationPreview {
  lines: PurchaseAdditionalCostLine[];
  totalAllocated: number;
}

export interface AdditionalCostsByCategoryRow {
  expenseCategory: string;
  documentCount: number;
  totalAmount: number;
  postedAmount: number;
  draftAmount: number;
}
