import { Component, inject, signal, OnInit, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalWorkflow, DOCUMENT_TYPES } from '../../../models/approval-workflow.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
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
    SharedDataGridComponent
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

  /** Screen-specific cell renderers passed generically to the Shared DataGrid. */
  private documentTypeTpl = viewChild<TemplateRef<any>>('documentTypeTemplate');
  private levelsTpl = viewChild<TemplateRef<any>>('levelsTemplate');
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const doc = this.documentTypeTpl();
    const levels = this.levelsTpl();
    const status = this.statusTpl();
    return {
      ...(doc ? { documentTypeTemplate: doc } : {}),
      ...(levels ? { levelsTemplate: levels } : {}),
      ...(status ? { statusTemplate: status } : {}),
    };
  }

  /** Config-driven columns -- same fields/formats as before (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'workflowName', dataType: 'string', caption: 'APPROVALS.WORKFLOW_NAME', width: 250 },
    { dataField: 'documentType', dataType: 'string', caption: 'APPROVALS.DOCUMENT_TYPE', width: 180, cellTemplate: 'documentTypeTemplate' },
    { dataField: 'description', dataType: 'string', caption: 'APPROVALS.DESCRIPTION', minWidth: 200 },
    { dataField: 'levels', dataType: 'string', caption: 'APPROVALS.LEVELS', width: 100, alignment: 'center', cellTemplate: 'levelsTemplate', allowSorting: false, allowFiltering: false },
    { dataField: 'isActive', dataType: 'boolean', caption: 'APPROVALS.STATUS', width: 120, alignment: 'center', cellTemplate: 'statusTemplate', allowSorting: false, allowFiltering: false },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'APPROVALS.ACTIONS', width: 180, allowSorting: false, allowFiltering: false },
  ];

  /** Already-authorized actions -- the activate/deactivate pair replaces the old
   *  dynamic-icon button using the built-in per-row visibility support. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'APPROVALS.EDIT_WORKFLOW' },
    {
      id: 'deactivate', icon: 'check_circle',
      labelKey: 'APPROVALS.DEACTIVATE_WORKFLOW',
      visible: (row: ApprovalWorkflow) => !!row.isActive,
    },
    {
      id: 'activate', icon: 'cancel',
      labelKey: 'APPROVALS.ACTIVATE_WORKFLOW',
      visible: (row: ApprovalWorkflow) => !row.isActive,
    },
    { id: 'delete', icon: 'trash', labelKey: 'APPROVALS.DELETE_WORKFLOW' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const workflow = e.row as ApprovalWorkflow;
    if (e.actionId === 'edit') this.editWorkflow(workflow.id);
    else if (e.actionId === 'activate' || e.actionId === 'deactivate') this.toggleStatus(workflow);
    else if (e.actionId === 'delete') this.deleteWorkflow(workflow);
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
