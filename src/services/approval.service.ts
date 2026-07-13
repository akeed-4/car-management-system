import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, map, tap } from 'rxjs';
import { environment } from '../environments/environment';
import {
  ApprovalWorkflow,
  CreateApprovalWorkflowDto,
  UpdateApprovalWorkflowDto,
  DocumentType
} from '../models/approval-workflow.model';
import {
  ApprovalRequest,
  ApprovalAction,
  ReturnApprovalAction,
  ApprovalHistory,
  ApprovalQuery,
  StartApprovalRequest,
  PendingApprovalSummary
} from '../models/approval-request.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovalService {
  private apiUrl = environment.origin + 'api';

  // Real-time updates for pending approvals count
  private pendingCountSubject = new BehaviorSubject<number>(0);
  public pendingCount$ = this.pendingCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.refreshPendingCount();
  }

  // ==================== WORKFLOW MANAGEMENT ====================

  getWorkflows(): Observable<ApprovalWorkflow[]> {
    return this.http.get<ApprovalWorkflow[]>(`${this.apiUrl}/ApprovalWorkflows`);
  }

  getWorkflowById(id: number): Observable<ApprovalWorkflow> {
    return this.http.get<ApprovalWorkflow>(`${this.apiUrl}/ApprovalWorkflows/${id}`);
  }

  getWorkflowsByDocumentType(documentType: DocumentType): Observable<ApprovalWorkflow[]> {
    return this.http.get<ApprovalWorkflow[]>(`${this.apiUrl}/ApprovalWorkflows/by-document-type/${documentType}`);
  }

  createWorkflow(workflow: CreateApprovalWorkflowDto): Observable<ApprovalWorkflow> {
    return this.http.post<ApprovalWorkflow>(`${this.apiUrl}/ApprovalWorkflows/Create`, workflow);
  }

  updateWorkflow(id: number, workflow: UpdateApprovalWorkflowDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/ApprovalWorkflows/${id}`, workflow);
  }

  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ApprovalWorkflows/${id}`);
  }

  toggleWorkflowStatus(id: number, isActive: boolean): Observable<void> {
    const action = isActive ? 'activate' : 'deactivate';
    return this.http.post<void>(`${this.apiUrl}/ApprovalWorkflows/${id}/${action}`, {});
  }

  // ==================== APPROVAL PROCESSES ====================

  submitForApproval(request: StartApprovalRequest): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalProcesses/start`, request).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  getApprovalRequestByDocument(documentType: DocumentType, documentId: number): Observable<ApprovalRequest> {
    return this.http.get<ApprovalRequest>(`${this.apiUrl}/ApprovalProcesses/by-document/${documentType}/${documentId}`);
  }

  getPendingApprovals(documentType?: DocumentType): Observable<ApprovalRequest[]> {
    let params = new HttpParams();
    if (documentType) {
      params = params.set('documentType', documentType);
    }
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/ApprovalProcesses/pending`, { params });
  }

  queryApprovals(query: ApprovalQuery): Observable<ApprovalRequest[]> {
    return this.http.post<ApprovalRequest[]>(`${this.apiUrl}/ApprovalProcesses/query`, query);
  }

  /**
   * There is no dedicated summary endpoint on the backend — derive summary stats
   * client-side from the current user's pending approvals.
   */
  getApprovalSummary(): Observable<PendingApprovalSummary> {
    return this.getPendingApprovals().pipe(
      map(approvals => {
        const byDocumentType: { [key: string]: number } = {};
        let highPriority = 0;
        let overdue = 0;
        const now = new Date();

        for (const approval of approvals) {
          byDocumentType[approval.documentType] = (byDocumentType[approval.documentType] || 0) + 1;
          if (approval.priority === 'High' || approval.priority === 'Urgent') {
            highPriority++;
          }
          if (approval.completedAt == null && approval.updatedAt && new Date(approval.updatedAt) < now) {
            overdue++;
          }
        }

        return {
          totalPending: approvals.length,
          highPriority,
          overdue,
          byDocumentType
        };
      })
    );
  }

  approve(action: ApprovalAction): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalProcesses/approve`, {
      approvalProcessId: action.approvalRequestId,
      comments: action.comment,
      attachments: action.attachments
    }).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  reject(action: ApprovalAction): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalProcesses/reject`, {
      approvalProcessId: action.approvalRequestId,
      comments: action.comment,
      attachments: action.attachments
    }).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  /**
   * Process an approve/reject action. Kept for backward compatibility with callers
   * that build an ApprovalAction with action: 'Approve' | 'Reject'.
   */
  processApproval(action: ApprovalAction): Observable<ApprovalRequest> {
    return action.action === 'Approve' ? this.approve(action) : this.reject(action);
  }

  returnApproval(action: ReturnApprovalAction): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalProcesses/return`, {
      approvalProcessId: action.approvalRequestId,
      returnToLevel: action.returnToLevel,
      comments: action.comment
    }).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  cancelApproval(approvalRequestId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/ApprovalProcesses/${approvalRequestId}/cancel`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' }
    }).pipe(
      tap(() => this.refreshPendingCount())
    );
  }

  getApprovalHistory(documentType: DocumentType, documentId: number): Observable<ApprovalHistory[]> {
    return this.getApprovalRequestByDocument(documentType, documentId).pipe(
      map(request => request.approvalHistory || [])
    );
  }

  getMyApprovalHistory(): Observable<ApprovalRequest[]> {
    return this.http.get<ApprovalRequest[]>(`${this.apiUrl}/ApprovalProcesses/my-history`);
  }

  canUserApprove(approvalProcessId: number): Observable<boolean> {
    return this.http.get<{ canApprove: boolean }>(`${this.apiUrl}/ApprovalProcesses/${approvalProcessId}/can-approve`).pipe(
      map(res => res.canApprove)
    );
  }

  // ==================== HELPER METHODS ====================

  private refreshPendingCount(): void {
    this.getPendingApprovals().subscribe({
      next: approvals => this.pendingCountSubject.next(approvals.length),
      error: error => console.error('Error loading pending approvals count:', error)
    });
  }

  /**
   * Public alias — some callers refresh the count after completing an action.
   */
  refreshCount(): void {
    this.refreshPendingCount();
  }

  getAvailableUsers(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string; roleName: string; status: string }[]>(`${this.apiUrl}/Users`).pipe(
      map(users => users.map(u => ({ id: u.id, name: u.name })))
    );
  }

  getAvailableRoles(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${this.apiUrl}/Roles`);
  }
}
