import { SalesChannel } from '../enums/sales-channel.enum';

/**
 * Sharikat (Corporate/Fleet) Sales Order Model
 * Represents bulk sales orders to corporate customers and organizations
 */
export interface SharikatSalesOrder {
  id?: number;
  orderNumber: string;
  salesChannel: SalesChannel.Sharikat;
  
  // Corporate Customer Information
  customerId: number;
  companyName?: string;
  companyTaxNumber?: string;
  companyCommercialRegister?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  
  // Quotation Reference (if converted from quotation)
  quotationId?: number;
  quotationNumber?: string;
  quotationApprovalDate?: string;
  
  // Purchase Order Information
  purchaseOrderNumber?: string;
  purchaseOrderDate?: string;
  purchaseOrderDocument?: string; // file path or URL
  
  // Fleet/Vehicle Information
  vehicles: FleetVehicleItem[];
  totalVehicles: number;
  
  // Financial Information
  subtotalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  vatPercentage: number;
  vatAmount: number;
  totalAmount: number;
  
  // Credit Management
  isCreditSale: boolean;
  creditTermDays?: number;
  creditLimit?: number;
  currentOutstandingBalance?: number;
  availableCredit?: number;
  requiresApproval: boolean;
  
  // Payment Information
  paymentTerms?: string;
  paymentMethod?: 'Cash' | 'BankTransfer' | 'Check' | 'Credit';
  advancePaymentAmount?: number;
  advancePaymentPercentage?: number;
  
  // Status and Workflow
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'Invoiced' | 'PartiallyDelivered' | 'Delivered' | 'Cancelled';
  approvalRequired: boolean;
  approvalWorkflowId?: number;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  
  // Invoice Information
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  
  // Delivery Information
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  deliveryNotes?: string;
  
  // Sales Information
  accountManagerId?: number;
  accountManagerName?: string;
  branchId?: number;
  branchName?: string;
  
  // Metadata
  notes?: string;
  internalNotes?: string;
  attachments?: string[]; // file paths or URLs
  createdBy?: string;
  createdDate: string;
  lastUpdated?: string;
}

/**
 * Fleet Vehicle Item
 * Represents individual vehicle in a fleet order
 */
export interface FleetVehicleItem {
  id?: number;
  vehicleId: number;
  vin?: string;
  chassisNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  unitPrice: number;
  discountAmount?: number;
  netPrice: number;
  status: 'Pending' | 'Allocated' | 'Delivered';
  deliveryDate?: string;
  notes?: string;
}

/**
 * DTO for creating Sharikat sales order
 */
export interface CreateSharikatSalesOrderDto {
  customerId: number;
  quotationId?: number;
  purchaseOrderNumber?: string;
  purchaseOrderDate?: string;
  vehicles: CreateFleetVehicleItemDto[];
  discountPercentage: number;
  isCreditSale: boolean;
  creditTermDays?: number;
  paymentMethod?: string;
  advancePaymentPercentage?: number;
  deliveryAddress?: string;
  deliveryCity?: string;
  expectedDeliveryDate?: string;
  accountManagerId?: number;
  branchId?: number;
  notes?: string;
}

/**
 * DTO for creating fleet vehicle item
 */
export interface CreateFleetVehicleItemDto {
  vehicleId: number;
  unitPrice: number;
  discountAmount?: number;
}

/**
 * DTO for converting quotation to order
 */
export interface ConvertQuotationToOrderDto {
  quotationId: number;
  purchaseOrderNumber: string;
  purchaseOrderDate: string;
  advancePaymentPercentage?: number;
  expectedDeliveryDate?: string;
}

/**
 * DTO for credit limit check
 */
export interface CreditLimitCheckDto {
  customerId: number;
  requestedAmount: number;
}

/**
 * Credit limit check result
 */
export interface CreditLimitCheckResult {
  isApproved: boolean;
  creditLimit: number;
  currentOutstanding: number;
  availableCredit: number;
  requestedAmount: number;
  requiresApproval: boolean;
  approvalThreshold?: number;
  message?: string;
}
