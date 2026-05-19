import { SalesChannel } from '../enums/sales-channel.enum';

/**
 * Bunuk (Bank/Finance) Sales Order Model
 * Represents sales orders facilitated through banking institutions and financing programs
 */
export interface BunukSalesOrder {
  id?: number;
  orderNumber: string;
  salesChannel: SalesChannel.Bunuk;
  
  // Customer Information
  customerId: number;
  customerName?: string;
  customerNationalId?: string;
  customerPhone?: string;
  customerEmployer?: string;
  customerMonthlyIncome?: number;
  
  // Bank/Financing Institution
  bankId: number;
  bankName?: string;
  bankBranch?: string;
  bankAccountOfficer?: string;
  bankContactPhone?: string;
  
  // Vehicle Information
  vehicleId: number;
  vehicleVin?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePrice: number;
  
  // Taameed/Finance Tracking
  taameedNumber?: string;
  taameedDate?: string;
  taameedDocument?: string; // file path or URL
  financingProgram?: string;
  financingType?: 'Murabaha' | 'Ijara' | 'Tawarruq' | 'Conventional';
  
  // Financial Terms
  financedAmount: number;
  downPaymentAmount: number;
  downPaymentPercentage: number;
  profitRate?: number;
  adminFees?: number;
  insuranceAmount?: number;
  totalFinancedAmount: number;
  financeTerm: number; // months
  monthlyInstallment: number;
  
  // Additional Charges
  registrationFees?: number;
  insuranceFees?: number;
  otherFees?: number;
  totalAdditionalCharges: number;
  
  // Grand Total
  grandTotal: number;
  
  // Finance Application Status
  applicationStatus: 
    | 'Draft'
    | 'Submitted'
    | 'UnderReview'
    | 'PendingDocuments'
    | 'BankApproved'
    | 'BankRejected'
    | 'TaameedReceived'
    | 'Completed'
    | 'Cancelled';
  
  // Application Tracking
  applicationSubmissionDate?: string;
  applicationApprovalDate?: string;
  applicationRejectionDate?: string;
  rejectionReason?: string;
  taameedReceivedDate?: string;
  
  // Required Documents Checklist
  documentsChecklist: FinanceDocumentItem[];
  allDocumentsReceived: boolean;
  
  // Bank Settlement
  settlementStatus: 'Pending' | 'InProgress' | 'Completed';
  settlementDate?: string;
  settlementAmount?: number;
  settlementReference?: string;
  
  // Invoice Information
  invoiceId?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  
  // Delivery Information
  deliveryStatus: 'Pending' | 'ReadyForDelivery' | 'Delivered';
  deliveryDate?: string;
  deliveryNotes?: string;
  
  // Status and Workflow
  status: 'Draft' | 'PendingFinancing' | 'FinanceApproved' | 'FinanceRejected' | 'TaameedReceived' | 'Invoiced' | 'Delivered' | 'Cancelled';
  
  // Sales Information
  salespersonId?: number;
  salespersonName?: string;
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
 * Finance Document Item
 * Represents required documents for finance application
 */
export interface FinanceDocumentItem {
  id?: number;
  documentType: string;
  documentName: string;
  isRequired: boolean;
  isReceived: boolean;
  receivedDate?: string;
  filePath?: string;
  notes?: string;
}

/**
 * DTO for creating Bunuk sales order
 */
export interface CreateBunukSalesOrderDto {
  customerId: number;
  bankId: number;
  vehicleId: number;
  vehiclePrice: number;
  downPaymentPercentage: number;
  financeTerm: number;
  profitRate?: number;
  adminFees?: number;
  insuranceAmount?: number;
  financingType?: string;
  financingProgram?: string;
  registrationFees?: number;
  insuranceFees?: number;
  otherFees?: number;
  salespersonId?: number;
  branchId?: number;
  notes?: string;
}

/**
 * DTO for submitting finance application
 */
export interface SubmitFinanceApplicationDto {
  orderId: number;
  requiredDocuments: string[];
}

/**
 * DTO for updating Taameed information
 */
export interface UpdateTaameedInfoDto {
  orderId: number;
  taameedNumber: string;
  taameedDate: string;
  taameedDocument?: string;
  bankApprovalDate?: string;
}

/**
 * DTO for recording bank settlement
 */
export interface RecordBankSettlementDto {
  orderId: number;
  settlementDate: string;
  settlementAmount: number;
  settlementReference: string;
  notes?: string;
}

/**
 * Finance calculation result
 */
export interface FinanceCalculationResult {
  vehiclePrice: number;
  downPaymentAmount: number;
  downPaymentPercentage: number;
  financedAmount: number;
  profitRate: number;
  profitAmount: number;
  adminFees: number;
  insuranceAmount: number;
  totalFinancedAmount: number;
  financeTerm: number;
  monthlyInstallment: number;
  totalRepaymentAmount: number;
  registrationFees: number;
  insuranceFees: number;
  otherFees: number;
  totalAdditionalCharges: number;
  grandTotal: number;
}
