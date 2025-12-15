// Sales Return Model
export interface SalesReturn {
  id?: number;
  returnNo: string;
  invoiceId: number;
  carId: number;
  vin: string;
  salePrice: number;
  vatAmount: number;
  depositAmount: number;
  refundableAmount: number;
  depositRefundable: boolean;
  reason: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  returnDate: Date;
  approvedBy?: number;
  approvedDate?: Date;
  rejectionReason?: string;
  createdBy: number;
  createdDate?: Date;
  updatedDate?: Date;
}

// Purchase Return Model
export interface PurchaseReturn {
  id?: number;
  returnNo: string;
  purchaseInvoiceId: number;
  carId: number;
  vin: string;
  purchasePrice: number;
  vatAmount: number;
  depositAmount: number;
  refundableAmount: number;
  depositRefundable: boolean;
  reason: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  returnDate: Date;
  approvedBy?: number;
  approvedDate?: Date;
  supplierId: number;
  createdBy: number;
  createdDate?: Date;
  updatedDate?: Date;
}

// Journal Entry Model
export interface JournalEntry {
  id?: number;
  salesReturnId?: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  entryDate: Date;
  reference: string;
  description: string;
}

// Purchase Return Journal Entry
export interface PurchaseReturnJournalEntry {
  id?: number;
  purchaseReturnId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  entryDate: Date;
  reference: string;
  description: string;
}

// Account Model
export interface ChartOfAccount {
  id: number;
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  isActive: boolean;
}

// Return Request DTO
export interface ReturnRequest {
  invoiceId?: number;
  purchaseInvoiceId?: number;
  carId: number;
  vin: string;
  salePrice?: number;
  purchasePrice?: number;
  reason: string;
  depositRefundable: boolean;
  depositAmount?: number;
}
