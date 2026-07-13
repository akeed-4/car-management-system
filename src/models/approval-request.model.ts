import { ApprovalLevel, DocumentType } from './approval-workflow.model';

export type ApprovalStatus = 'Pending' | 'InProgress' | 'Approved' | 'Rejected' | 'Cancelled' | 'Returned';
export type ApprovalHistoryAction = 'Approved' | 'Rejected' | 'Returned' | 'Cancelled' | 'Submitted' | 'Delegated';
export type ApprovalPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface ApprovalRequest {
  id: number;
  workflowId: number;
  workflowName: string;
  documentType: DocumentType;
  documentId: number;
  documentNumber?: string;
  status: ApprovalStatus;
  currentLevel: number;
  totalLevels: number;
  initiatedBy: number;
  initiatedByName: string;
  initiatedAt: string;
  completedAt?: string;
  completedBy?: number;
  completedByName?: string;
  comments?: string;
  priority: ApprovalPriority;
  amount?: number;
  updatedAt?: string;
  approvalHistory: ApprovalHistory[];
  currentLevelDetails?: ApprovalLevel;
}

export interface ApprovalHistory {
  id: number;
  approvalRequestId: number;
  level: number;
  levelName: string;
  approverId: number;
  approverName: string;
  action: ApprovalHistoryAction;
  comment?: string;
  actionDate: string;
  ipAddress?: string;
  durationHours?: number;
  isDelegated?: boolean;
  delegatedFrom?: number;
  delegatedFromName?: string;
  attachments?: string;
}

export interface StartApprovalRequest {
  documentType: DocumentType;
  documentId: number;
  documentNumber?: string;
  workflowId?: number;
  amount?: number;
  branchId?: number;
  comments?: string;
  priority?: ApprovalPriority;
}

export interface ApprovalAction {
  approvalRequestId: number;
  action: 'Approve' | 'Reject';
  comment?: string;
  attachments?: string;
}

export interface ReturnApprovalAction {
  approvalRequestId: number;
  returnToLevel: number;
  comment?: string;
}

export interface ApprovalQuery {
  documentType?: DocumentType;
  status?: ApprovalStatus;
  initiatedBy?: number;
  currentLevel?: number;
  fromDate?: string;
  toDate?: string;
  priority?: ApprovalPriority;
  companyId?: number;
  branchId?: number;
}

export interface PendingApprovalSummary {
  totalPending: number;
  highPriority: number;
  overdue: number;
  byDocumentType: { [key: string]: number };
}
