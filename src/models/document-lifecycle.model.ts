/** Mirrors the backend's DocumentStatus enum (Domain/Enums/DocumentStatus.cs). Serialized as a string. */
export type DocumentStatus = 'Draft' | 'Approved' | 'Rejected' | 'Cancelled' | 'Closed';

export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  Draft: '#9e9e9e',
  Approved: '#2e7d32',
  Rejected: '#c62828',
  Cancelled: '#616161',
  Closed: '#1565c0'
};

/** Mirrors BaseDocumentDto (Application/DTOs/BaseDocumentDto.cs) -- fields common to every lifecycle-enabled document. */
export interface BaseDocumentDto {
  id: number;
  documentNumber: string;
  status: DocumentStatus;

  createdBy: number;
  createdAt: string;
  modifiedBy?: number;
  modifiedAt?: string;

  approvedBy?: number;
  approvedAt?: string;

  rejectedBy?: number;
  rejectedAt?: string;
  rejectionReason?: string;

  cancelledBy?: number;
  cancelledAt?: string;
  cancellationReason?: string;
}

/** Mirrors DocumentActionReasonDto -- shared body for Reject/Cancel endpoints. */
export interface DocumentActionReasonDto {
  reason: string;
}

export type DocumentLifecycleAction = 'approve' | 'reject' | 'cancel' | 'reopen';

/** Mirrors Domain/Enums/DocumentNumberingEnums.cs -- DocumentNumberFormat. */
export type DocumentNumberFormat =
  | 'SequentialOnly'
  | 'DatePlusSequence'
  | 'YearMonthSequence'
  | 'BranchDateSequence'
  | 'StoreDateSequence'
  | 'FiscalYearSequence';

/** Mirrors Domain/Enums/DocumentNumberingEnums.cs -- DocumentNumberResetCadence. */
export type DocumentNumberResetCadence = 'Never' | 'Daily' | 'Monthly' | 'Yearly' | 'FiscalYear';

/** Mirrors Application/DTOs/DocumentNumberingSettingDto.cs. */
export interface DocumentNumberingSettingDto {
  id: number;
  companyId: number;
  branchId?: number;
  storeId?: number;
  documentType: string;
  autoNumberingEnabled: boolean;
  format: DocumentNumberFormat;
  resetCadence: DocumentNumberResetCadence;
  prefix?: string;
  suffix?: string;
  digitPadding: number;
  startingNumber: number;
  useDateBasedMaxNumber: boolean;
  fiscalYearStartMonth: number;
  isActive: boolean;
  /** Server-computed: LastNumber issued so far for the active bucket (0 if none yet), and the
   * real next formatted number (null when autoNumberingEnabled is false -- manual entry only). */
  currentNumber: number;
  nextNumberPreview?: string;
}

export interface CreateDocumentNumberingSettingDto {
  companyId: number;
  branchId?: number;
  storeId?: number;
  documentType: string;
  autoNumberingEnabled: boolean;
  format: DocumentNumberFormat;
  resetCadence: DocumentNumberResetCadence;
  prefix?: string;
  suffix?: string;
  digitPadding: number;
  startingNumber: number;
  useDateBasedMaxNumber: boolean;
  fiscalYearStartMonth: number;
  isActive: boolean;
}

export interface UpdateDocumentNumberingSettingDto extends CreateDocumentNumberingSettingDto {}

/** Mirrors Application/DTOs/DocumentLifecycleSettingDto.cs. */
export interface DocumentLifecycleSettingDto {
  id: number;
  companyId: number;
  documentType: string;
  autoApproveOnSave: boolean;
}

export interface CreateDocumentLifecycleSettingDto {
  companyId: number;
  documentType: string;
  autoApproveOnSave: boolean;
}

export interface UpdateDocumentLifecycleSettingDto extends CreateDocumentLifecycleSettingDto {}

/** Mirrors Domain/Entities/DocumentAuditTrail.cs. */
export interface DocumentAuditTrailEntryDto {
  id: number;
  entityName: string;
  entityId: number;
  action: string;
  performedBy: number;
  performedByName?: string;
  performedAt: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

/** Every document type in the ERP that has its own generated number and lifecycle setting.
 * Single source of truth for the Document Numbering Settings and Document Lifecycle Settings
 * admin screens. Mirrors the backend's Domain/Constants/DocumentTypes.cs (same `value` keys). */
export const DOCUMENT_TYPES: { value: string; labelKey: string }[] = [
  // Purchasing
  { value: 'PR', labelKey: 'DOCUMENT_TYPES.PR' },
  { value: 'RFQ', labelKey: 'DOCUMENT_TYPES.RFQ' },
  { value: 'PO', labelKey: 'DOCUMENT_TYPES.PO' },
  { value: 'GRN', labelKey: 'DOCUMENT_TYPES.GRN' },
  { value: 'PINV', labelKey: 'DOCUMENT_TYPES.PINV' },
  { value: 'PRET', labelKey: 'DOCUMENT_TYPES.PRET' },
  // Sales - Retail (Afrad)
  { value: 'RQ', labelKey: 'DOCUMENT_TYPES.RQ' },
  { value: 'SO-RTL', labelKey: 'DOCUMENT_TYPES.SO-RTL' },
  { value: 'INV-RTL', labelKey: 'DOCUMENT_TYPES.INV-RTL' },
  { value: 'DN-RTL', labelKey: 'DOCUMENT_TYPES.DN-RTL' },
  // Sales - Corporate (Sharikat)
  { value: 'CQ', labelKey: 'DOCUMENT_TYPES.CQ' },
  { value: 'INV-CORP', labelKey: 'DOCUMENT_TYPES.INV-CORP' },
  { value: 'DN-CORP', labelKey: 'DOCUMENT_TYPES.DN-CORP' },
  { value: 'GP-CORP', labelKey: 'DOCUMENT_TYPES.GP-CORP' },
  // Sales - Bank (Bunuk)
  { value: 'BQ', labelKey: 'DOCUMENT_TYPES.BQ' },
  { value: 'SO-BANK', labelKey: 'DOCUMENT_TYPES.SO-BANK' },
  { value: 'INV-BANK', labelKey: 'DOCUMENT_TYPES.INV-BANK' },
  { value: 'DN-BANK', labelKey: 'DOCUMENT_TYPES.DN-BANK' },
  { value: 'GP-BANK', labelKey: 'DOCUMENT_TYPES.GP-BANK' },
  // Sales - legacy/generic
  { value: 'CUSTQ', labelKey: 'DOCUMENT_TYPES.CUSTQ' },
  { value: 'SRET', labelKey: 'DOCUMENT_TYPES.SRET' },
  // Accounting
  { value: 'JE', labelKey: 'DOCUMENT_TYPES.JE' },
  { value: 'RCPT', labelKey: 'DOCUMENT_TYPES.RCPT' },
  { value: 'PAY', labelKey: 'DOCUMENT_TYPES.PAY' },
  { value: 'DEP', labelKey: 'DOCUMENT_TYPES.DEP' },
  // Other
  { value: 'CONS', labelKey: 'DOCUMENT_TYPES.CONS' },
  { value: 'SVCO', labelKey: 'DOCUMENT_TYPES.SVCO' },
  { value: 'REQCAR', labelKey: 'DOCUMENT_TYPES.REQCAR' },
  { value: 'SALESREQ', labelKey: 'DOCUMENT_TYPES.SALESREQ' },
  { value: 'DELSCH', labelKey: 'DOCUMENT_TYPES.DELSCH' }
];
