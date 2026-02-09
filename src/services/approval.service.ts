import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { 
  ApprovalWorkflow, 
  DocumentType 
} from '../models/approval-workflow.model';
import { 
  ApprovalRequest, 
  ApprovalAction, 
  ApprovalHistory,
  PendingApprovalSummary,
  ApprovalStatus
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
    this.loadPendingCount();
  }

  // ==================== WORKFLOW MANAGEMENT ====================
  
  /**
   * Get all approval workflows
   */
  getWorkflows(): Observable<ApprovalWorkflow[]> {
    return this.http.get<ApprovalWorkflow[]>(`${this.apiUrl}/ApprovalWorkflows`);
  }

  /**
   * Get workflow by ID
   */
  getWorkflowById(id: number): Observable<ApprovalWorkflow> {
    return this.http.get<ApprovalWorkflow>(`${this.apiUrl}/ApprovalWorkflows/${id}`);
  }

  /**
   * Get workflows by document type
   */
  getWorkflowsByDocumentType(documentType: DocumentType): Observable<ApprovalWorkflow[]> {
    return this.http.get<ApprovalWorkflow[]>(`${this.apiUrl}/ApprovalWorkflows/ByType/${documentType}`);
  }

  /**
   * Create new workflow
   */
  createWorkflow(workflow: Omit<ApprovalWorkflow, 'id'>): Observable<ApprovalWorkflow> {
    return this.http.post<ApprovalWorkflow>(`${this.apiUrl}/ApprovalWorkflows`, workflow);
  }

  /**
   * Update workflow
   */
  updateWorkflow(id: number, workflow: Partial<ApprovalWorkflow>): Observable<ApprovalWorkflow> {
    return this.http.put<ApprovalWorkflow>(`${this.apiUrl}/ApprovalWorkflows/${id}`, workflow);
  }

  /**
   * Delete workflow
   */
  deleteWorkflow(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/ApprovalWorkflows/${id}`);
  }

  /**
   * Activate/Deactivate workflow
   */
  toggleWorkflowStatus(id: number, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/ApprovalWorkflows/${id}/Status`, { isActive });
  }

  // ==================== APPROVAL REQUESTS ====================

  /**
   * Submit document for approval
   */
  submitForApproval(
    documentType: DocumentType,
    documentId: number,
    documentNumber: string,
    amount?: number
  ): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalRequests/Submit`, {
      documentType,
      documentId,
      documentNumber,
      amount
    }).pipe(
      tap(() => this.loadPendingCount())
    );
  }

  /**
   * Get approval request by document
   */
  getApprovalRequestByDocument(
    documentType: DocumentType,
    documentId: number
  ): Observable<ApprovalRequest> {
    return this.http.get<ApprovalRequest>(
      `${this.apiUrl}/ApprovalRequests/ByDocument/${documentType}/${documentId}`
    );
  }

  /**
   * Get pending approvals for current user
   */
  getPendingApprovals(
    page: number = 1,
    pageSize: number = 20,
    documentType?: DocumentType,
    priority?: string
  ): Observable<{ items: ApprovalRequest[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (documentType) {
      params = params.set('documentType', documentType);
    }
    if (priority) {
      params = params.set('priority', priority);
    }

    return this.http.get<{ items: ApprovalRequest[]; total: number }>(
      `${this.apiUrl}/ApprovalRequests/Pending`,
      { params }
    );
  }

  /**
   * Get approval requests by status
   */
  getApprovalsByStatus(
    status: ApprovalStatus,
    page: number = 1,
    pageSize: number = 20
  ): Observable<{ items: ApprovalRequest[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('status', status);

    return this.http.get<{ items: ApprovalRequest[]; total: number }>(
      `${this.apiUrl}/ApprovalRequests/ByStatus`,
      { params }
    );
  }

  /**
   * Get approval summary for current user
   */
  getApprovalSummary(): Observable<PendingApprovalSummary> {
    return this.http.get<PendingApprovalSummary>(`${this.apiUrl}/ApprovalRequests/Summary`);
  }

  /**
   * Process approval action (Approve/Reject)
   */
  processApproval(action: ApprovalAction): Observable<ApprovalRequest> {
    return this.http.post<ApprovalRequest>(`${this.apiUrl}/ApprovalRequests/Process`, action)
      .pipe(
        tap(() => this.loadPendingCount())
      );
  }

  /**
   * Cancel approval request
   */
  cancelApproval(approvalRequestId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/ApprovalRequests/${approvalRequestId}/Cancel`, { reason })
      .pipe(
        tap(() => this.loadPendingCount())
      );
  }

  /**
   * Get approval history for document
   */
  getApprovalHistory(
    documentType: DocumentType,
    documentId: number
  ): Observable<ApprovalHistory[]> {
    return this.http.get<ApprovalHistory[]>(
      `${this.apiUrl}/ApprovalRequests/History/${documentType}/${documentId}`
    );
  }

  /**
   * Get my approval history (documents I approved)
   */
  getMyApprovalHistory(
    page: number = 1,
    pageSize: number = 20,
    fromDate?: string,
    toDate?: string
  ): Observable<{ items: ApprovalHistory[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    
    if (fromDate) {
      params = params.set('fromDate', fromDate);
    }
    if (toDate) {
      params = params.set('toDate', toDate);
    }

    return this.http.get<{ items: ApprovalHistory[]; total: number }>(
      `${this.apiUrl}/ApprovalRequests/MyHistory`,
      { params }
    );
  }

  // ==================== HELPER METHODS ====================

  /**
   * Load pending approval count for current user
   */
  private loadPendingCount(): void {
    this.http.get<number>(`${this.apiUrl}/ApprovalRequests/PendingCount`)
      .subscribe({
        next: (count) => this.pendingCountSubject.next(count),
        error: (error) => console.error('Error loading pending count:', error)
      });
  }

  /**
   * Refresh pending count manually
   */
  refreshPendingCount(): void {
    this.loadPendingCount();
  }

  /**
   * Check if document requires approval
   */
  requiresApproval(documentType: DocumentType, amount?: number): Observable<boolean> {
    let params = new HttpParams().set('documentType', documentType);
    if (amount !== undefined) {
      params = params.set('amount', amount.toString());
    }
    return this.http.get<boolean>(`${this.apiUrl}/ApprovalRequests/RequiresApproval`, { params });
  }

  /**
   * Get available users for approval assignment
   */
  getAvailableUsers(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${this.apiUrl}/Users/ForApproval`);
  }

  /**
   * Get available roles for approval assignment
   */
  getAvailableRoles(): Observable<{ id: number; name: string }[]> {
    return this.http.get<{ id: number; name: string }[]>(`${this.apiUrl}/Roles/ForApproval`);
  }
}
