import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalWorkflow, DOCUMENT_TYPES } from '../../../models/approval-workflow.model';
import { ToastService } from '../../../services/toast.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-approval-workflow-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './approval-workflow-list.component.html',
  styleUrls: ['./approval-workflow-list.component.css']
})
export class ApprovalWorkflowListComponent implements OnInit {
  private approvalService = inject(ApprovalService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  workflows = signal<ApprovalWorkflow[]>([]);
  isLoading = signal(false);

  documentTypes = DOCUMENT_TYPES;

  constructor() {
    this.editWorkflowClick = this.editWorkflowClick.bind(this);
    this.toggleStatusClick = this.toggleStatusClick.bind(this);
    this.deleteWorkflowClick = this.deleteWorkflowClick.bind(this);
    this.statusIcon = this.statusIcon.bind(this);
    this.statusHint = this.statusHint.bind(this);
  }

  ngOnInit(): void {
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.isLoading.set(true);
    this.approvalService.getWorkflows().subscribe({
      next: (workflows) => {
        this.workflows.set(workflows);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading workflows:', error);
       this.toastService.showError(this.translate.instant('APPROVALS.ERROR_LOADING_WORKFLOWS'));
        this.isLoading.set(false);
      }
    });
  }

  createWorkflow(): void {
    this.router.navigate(['/approvals/workflows/new']);
  }

  editWorkflow(id: number): void {
    this.router.navigate(['/approvals/workflows/edit', id]);
  }

  viewWorkflow(id: number): void {
    this.router.navigate(['/approvals/workflows/view', id]);
  }

  editWorkflowClick(e: any): void {
    this.editWorkflow(e.row.data.id);
  }

  toggleStatusClick(e: any): void {
    this.toggleStatus(e.row.data);
  }

  deleteWorkflowClick(e: any): void {
    this.deleteWorkflow(e.row.data);
  }

  statusIcon(e: any): string {
    return this.getStatusIcon(e.row.data);
  }

  statusHint(e: any): string {
    return this.translate.instant(this.getStatusHint(e.row.data));
  }

  async toggleStatus(workflow: ApprovalWorkflow): Promise<void> {
    const action = workflow.isActive ? 'deactivate' : 'activate';
    const confirmed = await this.notificationService.confirmAlert(
      `Are you sure you want to ${action} this workflow?`,
      'Confirm'
    );

    if (confirmed) {
      this.approvalService.toggleWorkflowStatus(workflow.id, !workflow.isActive).subscribe({
        next: () => {
          this.toastService.showSuccess(`APPROVALS.WORKFLOW_${action.toUpperCase()}D`);
          this.loadWorkflows();
        },
        error: (error) => {
          console.error(`Error ${action}ing workflow:`, error);
         this.toastService.showError(this.translate.instant(`APPROVALS.ERROR_${action.toUpperCase()}_WORKFLOW`)) ;
        }
      });
    }
  }

  async deleteWorkflow(workflow: ApprovalWorkflow): Promise<void> {
    const confirmed = await this.notificationService.confirmAlert(
      'Are you sure you want to delete this workflow? This action cannot be undone.',
      'Delete Workflow'
    );

    if (confirmed) {
      this.approvalService.deleteWorkflow(workflow.id).subscribe({
        next: () => {
          this.toastService.showSuccess('APPROVALS.WORKFLOW_DELETED');
          this.loadWorkflows();
        },
        error: (error) => {
          console.error('Error deleting workflow:', error);
         this.toastService.showError(this.translate.instant('APPROVALS.ERROR_DELETE_WORKFLOW'));
        }
      });
    }
  }

  getDocumentTypeLabel(type: string): string {
    return this.documentTypes.find(dt => dt.value === type)?.label || type;
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'primary' : 'warn';
  }

  getStatusIcon(workflow: ApprovalWorkflow): string {
    return workflow.isActive ? 'check_circle' : 'cancel';
  }

  getStatusHint(workflow: ApprovalWorkflow): string {
    return workflow.isActive ? 'APPROVALS.DEACTIVATE_WORKFLOW' : 'APPROVALS.ACTIVATE_WORKFLOW';
  }

  getLevelSummary(workflow: ApprovalWorkflow): string {
    const count = workflow.approvalLevels?.length || 0;
    return `${count} Level${count !== 1 ? 's' : ''}`;
  }
}
