// DocumentType is a free-form string on the backend (Application.Services.ApprovalWorkflowService
// keys workflows by this string). DOCUMENT_TYPES below is a curated list for dropdowns only —
// it is not an exhaustive union, since new document types can be added on the backend without a
// matching frontend release.
export type DocumentType = string;
export type ApproverType = 'User' | 'Role';
export type ConditionOperator = 'GreaterThan' | 'LessThan' | 'Equal' | 'Between' | 'In';

export interface ApprovalCondition {
  id?: number;
  workflowId?: number;
  conditionType: string; // e.g., 'amount', 'branchId', 'supplierId' — maps to backend ConditionType
  operator: ConditionOperator;
  value1?: string;
  value2?: string; // For 'Between' operator
  logicalOperator?: 'AND' | 'OR';
}

export interface ApprovalLevelUser {
  id?: number;
  approvalLevelId?: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  approvalOrder?: number;
  isActive?: boolean;
}

export interface ApprovalLevel {
  id?: number;
  workflowId?: number;
  levelNumber: number;
  levelName: string;
  approvalType?: string; // 'Single' | 'Multiple' etc — backend ApprovalType
  approvalMode?: string; // 'Any' | 'All' — backend ApprovalMode
  roleId?: number;
  roleName?: string;
  isRequired?: boolean;
  canSkip?: boolean;
  escalationHours?: number;
  sendNotification?: boolean;
  sendReminder?: boolean;
  reminderHours?: number;
  levelUsers?: ApprovalLevelUser[];
}

export interface ApprovalWorkflow {
  id: number;
  documentType: DocumentType;
  workflowName: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  companyId?: number;
  branchId?: number;
  priority: number;
  companyName?: string;
  branchName?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  approvalLevels: ApprovalLevel[];
  approvalConditions: ApprovalCondition[];
}

export interface CreateApprovalWorkflowDto {
  documentType: DocumentType;
  workflowName: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  companyId?: number;
  branchId?: number;
  priority: number;
  approvalLevels: CreateApprovalLevelDto[];
  approvalConditions: CreateApprovalConditionDto[];
}

export interface CreateApprovalLevelDto {
  levelNumber: number;
  levelName: string;
  approvalType: string;
  approvalMode: string;
  roleId?: number;
  isRequired: boolean;
  canSkip: boolean;
  escalationHours?: number;
  sendNotification: boolean;
  sendReminder: boolean;
  reminderHours?: number;
  userIds: number[];
}

export interface CreateApprovalConditionDto {
  conditionType: string;
  operator: ConditionOperator;
  value1?: string;
  value2?: string;
  logicalOperator: 'AND' | 'OR';
}

export interface UpdateApprovalWorkflowDto {
  workflowName?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
  priority?: number;
}

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'PurchaseInvoice', label: 'Purchase Invoice' },
  { value: 'SalesInvoice', label: 'Sales Invoice' },
  { value: 'Expense', label: 'Expense' },
  { value: 'Payment', label: 'Payment' },
  { value: 'Receipt', label: 'Receipt' },
  { value: 'StockTake', label: 'Stock Take' },
  { value: 'Transfer', label: 'Transfer' }
];

export const APPROVER_TYPES: { value: ApproverType; label: string }[] = [
  { value: 'User', label: 'Specific User' },
  { value: 'Role', label: 'Role' }
];

export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: 'GreaterThan', label: 'Greater Than' },
  { value: 'LessThan', label: 'Less Than' },
  { value: 'Equal', label: 'Equal To' },
  { value: 'Between', label: 'Between' },
  { value: 'In', label: 'In List' }
];

export class MenuCodeData {
  public static readonly Requests = 1;
  public static readonly ApprovalsSteps = 2;
  public static readonly DocumentsApprovals = 3;
  public static readonly ImportBasicData = 4;
  public static readonly MenuEncoding = 5;
  public static readonly ApplicationSettings = 6;
  public static readonly Countries = 7;
  public static readonly States = 8;
  public static readonly Cities = 9;
  public static readonly Districts = 10;
  public static readonly Business = 11;
  public static readonly Branches = 12;
  public static readonly Stores = 13;
  public static readonly Supplier = 14;
  public static readonly Client = 15;
  public static readonly Seller = 16;
  public static readonly Bank = 17;
  public static readonly NotesIdentifiers = 18;
  public static readonly SellerCommissionNames = 19;
  public static readonly InvoiceExpenseTypes = 20;
  public static readonly ShipmentTypes = 21;
  public static readonly ShippingStatusTypes = 22;
  public static readonly SellersCommissionMethods = 23;
  public static readonly Taxes = 24;
  public static readonly PaymentMethods = 25;
  public static readonly Currencies = 26;
  public static readonly CurrenciesRates = 27;
  public static readonly Item = 28;
  public static readonly ItemPackages = 29;
  public static readonly ItemsCategory = 30;
  public static readonly Vendors = 31;
  public static readonly ItemAttributes = 32;
  public static readonly OpenBalance = 33;
  public static readonly CurrentBalance = 34;
  public static readonly ItemCost = 35;
  public static readonly StockTakingOpenBalance = 36;
  public static readonly ApprovalStockTakingAsOpenBalance = 37;
  public static readonly StockTakingCurrentBalance = 38;
  public static readonly ApprovalStockTakingAsCurrentBalance = 39;
  public static readonly InventoryIn = 40;
  public static readonly InventoryOut = 41;
  public static readonly InternalTransferItems = 42;
  public static readonly InternalReceiveItems = 43;
  public static readonly Account = 44;
  public static readonly JournalEntry = 45;
  public static readonly ReceiptVoucher = 46;
  public static readonly PaymentVoucher = 47;
  public static readonly CostCenter = 48;
  public static readonly ProductRequest = 49;
  public static readonly ProductRequestPrice = 50;
  public static readonly SupplierQuotation = 51;
  public static readonly CashPurchaseInvoice = 52;
  public static readonly CreditPurchaseInvoice = 53;
  public static readonly CashPurchaseInvoiceReturn = 54;
  public static readonly CreditPurchaseInvoiceReturn = 55;
  public static readonly PurchaseOrder = 56;
  public static readonly ReceiptStatement = 57;
  public static readonly ReceiptStatementReturn = 58;
  public static readonly PurchaseInvoiceInterim = 59;
  public static readonly PurchaseInvoiceOnTheWayCash = 60;
  public static readonly PurchaseInvoiceOnTheWayCredit = 61;
  public static readonly ReceiptFromPurchaseInvoiceOnTheWay = 62;
  public static readonly ReceiptFromPurchaseInvoiceOnTheWayReturn = 63;
  public static readonly PurchaseInvoiceReturnOnTheWay = 64;
  public static readonly ReturnFromPurchaseInvoice = 65;
  public static readonly PurchaseInvoiceReturn = 66;
  public static readonly SupplierDebitMemo = 67;
  public static readonly SupplierCreditMemo = 68;
  public static readonly ClientPriceRequest = 69;
  public static readonly CustomerQuotation = 70;
  public static readonly CustomerQuotationApproval = 71;
  public static readonly CashSalesInvoice = 72;
  public static readonly CreditSalesInvoice = 73;
  public static readonly CashSalesInvoiceReturn = 74;
  public static readonly CreditSalesInvoiceReturn = 75;
  public static readonly ProformaInvoice = 76;
  public static readonly StockOutFromProformaInvoice = 77;
  public static readonly StockOutReturnFromStockOut = 78;
  public static readonly SalesInvoiceInterim = 79;
  public static readonly CashReservationInvoice = 80;
  public static readonly CreditReservationInvoice = 81;
  public static readonly StockOutFromReservation = 82;
  public static readonly StockOutReturnFromReservation = 83;
  public static readonly ReservationInvoiceCloseOut = 84;
  public static readonly StockOutReturnFromInvoice = 85;
  public static readonly SalesInvoiceReturn = 86;
  public static readonly ClientDebitMemo = 87;
  public static readonly ClientCreditMemo = 88;
  public static readonly DisassembleItemPackages = 89;
  public static readonly DisassembleItemPackagesStatement = 90;
  public static readonly FixedAsset = 158;
  public static readonly FixedAssetMovement = 159;
  public static readonly FixedAssetAddition = 160;
  public static readonly FixedAssetExclusion = 161;
  public static readonly FixedAssetDepreciation = 162;
  public static readonly CommercialMovementOfSales = 163;
  public static readonly JournalEntryOpenBalance = 164;
  public static readonly JournalEntriesReport = 165;
}
