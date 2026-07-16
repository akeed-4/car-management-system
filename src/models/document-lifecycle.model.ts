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
  useDateBasedMaxNumber: boolean;
  fiscalYearStartMonth: number;
  isActive: boolean;
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

/** Document types known to the numbering/lifecycle engine so far. Extend as more modules are migrated. */
export const DOCUMENT_TYPES: { value: string; labelKey: string }[] = [
  { value: 'GRN', labelKey: 'DOCUMENT_TYPES.GRN' }
];
