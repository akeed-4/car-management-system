export type RetailSalesOrderStatus =
  | 'Draft'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'Converted'
  | 'Cancelled';

export interface RetailSalesOrderLineDto {
  id: number;
  carId: number;
  vin: string;
  carDescription: string;
  orderedPrice: number;
}

export interface RetailSalesOrderDto {
  id: number;
  orderNumber: string;
  retailQuotationId: number;
  customerName: string;
  customerMobile: string;
  customerNationalId: string;
  orderDate: string;
  status: RetailSalesOrderStatus;
  totalAmount: number;
  notes?: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  lines: RetailSalesOrderLineDto[];
}

export interface CreateRetailSalesOrderRequest {
  retailQuotationId: number;
  notes?: string;
  userId: number;
}

export interface UpdateRetailSalesOrderDto {
  notes?: string;
}

export interface PendingRetailQuotationLookupDto {
  id: number;
  quotationNumber: string;
  customerName: string;
  quotationDate: string;
  totalAmount: number;
}
