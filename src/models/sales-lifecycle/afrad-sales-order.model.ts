import { SalesChannel } from '../enums/sales-channel.enum';

/**
 * Afrad (Individual) Sales Order Model
 * Represents a sales order for individual/retail customers
 */
export interface AfradSalesOrder {
  id?: number;
  orderNumber: string;
  salesChannel: SalesChannel.Afrad;
  
  // Customer Information
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  customerNationalId?: string;
  
  // Vehicle Information
  vehicleId: number;
  vehicleVin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  
  // Financial Information
  totalAmount: number;
  advancePaymentVoucherId?: number;
  advancePaymentAmount: number;
  remainingAmount: number;
  
  // Financing Information (if applicable)
  isFinanced: boolean;
  financeBankId?: number;
  financeBankName?: string;
  financedAmount?: number;
  downPaymentPercentage?: number;
  financeTerm?: number; // months
  monthlyInstallment?: number;
  
  // Status and Workflow
  status: 'Draft' | 'Reserved' | 'Approved' | 'Invoiced' | 'Delivered' | 'Cancelled';
  reservationDate?: string;
  approvalDate?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  
  // Sales Information
  salespersonId?: number;
  salespersonName?: string;
  branchId?: number;
  branchName?: string;
  
  // Metadata
  notes?: string;
  internalNotes?: string;
  createdBy?: string;
  createdDate: string;
  lastUpdated?: string;
}

/**
 * DTO for creating Afrad sales order
 */
export interface CreateAfradSalesOrderDto {
  customerId: number;
  vehicleId: number;
  advancePaymentVoucherId?: number;
  advancePaymentAmount: number;
  totalAmount: number;
  isFinanced: boolean;
  financeBankId?: number;
  financedAmount?: number;
  downPaymentPercentage?: number;
  financeTerm?: number;
  salespersonId?: number;
  branchId?: number;
  notes?: string;
}

/**
 * DTO for reserving vehicle with deposit
 */
export interface ReserveVehicleDto {
  orderId: number;
  advancePaymentVoucherId: number;
}
