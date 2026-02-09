import { DocumentType } from './approval-workflow.model';

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ApprovalRequest {
  id: number;
  workflowId: number;
  workflowName: string;
  documentType: DocumentType;
  documentId: number;
  documentNumber: string;
  documentAmount?: number;
  requestedBy: string;
  requestedById: number;
  requestedAt: string;
  currentLevel: number;
  totalLevels: number;
  status: ApprovalStatus;
  priority?: 'Low' | 'Medium' | 'High';
  dueDate?: string;
  completedAt?: string;
  approvalHistory: ApprovalHistory[];
}

export interface ApprovalHistory {
  id: number;
  approvalRequestId: number;
  level: number;
  levelName: string;
  approverId: number;
  approverName: string;
  action: 'Approved' | 'Rejected';
  comment?: string;
  actionDate: string;
}

export interface ApprovalAction {
  approvalRequestId: number;
  action: 'Approve' | 'Reject';
  comment?: string;
}

export interface PendingApprovalSummary {
  totalPending: number;
  highPriority: number;
  overdue: number;
  byDocumentType: { [key in DocumentType]?: number };
}
