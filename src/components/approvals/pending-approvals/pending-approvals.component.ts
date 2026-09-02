import { Component, inject, signal, OnInit, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalRequest, PendingApprovalSummary } from '../../../models/approval-request.model';
import { ApprovalActionDialogComponent } from '../approval-action-dialog/approval-action-dialog.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { ToastService } from '../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatTabsModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule,
    SharedDataGridComponent
  ],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.css']
})
export class PendingApprovalsComponent implements OnInit {
  private approvalService = inject(ApprovalService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);
  pendingApprovals = signal<ApprovalRequest[]>([]);
  summary = signal<PendingApprovalSummary | null>(null);
  isLoading = signal(false);
  selectedTab = signal(0);

  /** Screen-specific cell renderers passed generically to the Shared DataGrid. */
  private documentTypeTpl = viewChild<TemplateRef<any>>('documentTypeTemplate');
  private progressTpl = viewChild<TemplateRef<any>>('progressTemplate');
  private priorityTpl = viewChild<TemplateRef<any>>('priorityTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const doc = this.documentTypeTpl();
    const progress = this.progressTpl();
    const priority = this.priorityTpl();
    return {
      ...(doc ? { documentTypeTemplate: doc } : {}),
      ...(progress ? { progressTemplate: progress } : {}),
      ...(priority ? { priorityTemplate: priority } : {}),
    };
  }

  /** Config-driven columns -- same fields/formats as before (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'documentNumber', dataType: 'string', caption: 'APPROVALS.DOCUMENT_NUMBER', width: 150 },
    { dataField: 'documentType', dataType: 'string', caption: 'APPROVALS.DOCUMENT_TYPE', width: 150, cellTemplate: 'documentTypeTemplate' },
    { dataField: 'amount', dataType: 'number', format: 'currency', caption: 'APPROVALS.AMOUNT', width: 120 },
    { dataField: 'initiatedByName', dataType: 'string', caption: 'APPROVALS.REQUESTED_BY', width: 150 },
    { dataField: 'initiatedAt', dataType: 'date', format: 'shortDate', caption: 'APPROVALS.REQUESTED_DATE', width: 120 },
    { dataField: 'progress', dataType: 'string', caption: 'APPROVALS.PROGRESS', width: 150, cellTemplate: 'progressTemplate', allowSorting: false, allowFiltering: false },
    { dataField: 'priority', dataType: 'string', caption: 'APPROVALS.PRIORITY', width: 100, alignment: 'center', cellTemplate: 'priorityTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'APPROVALS.ACTIONS', width: 100, allowSorting: false, allowFiltering: false },
  ];

  /** Already-authorized actions (same review button as before). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'review', icon: 'check', labelKey: 'APPROVALS.REVIEW', visible: () => this.permissionService.hasPermission('approvals.pending.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'review') this.openApprovalDialog(e.row as ApprovalRequest);
  }

  ngOnInit(): void {
    this.loadPendingApprovals();
    this.loadSummary();
  }

  loadPendingApprovals(): void {
    this.isLoading.set(true);
    this.approvalService.getPendingApprovals().subscribe({
      next: (approvals) => {
        this.pendingApprovals.set(approvals);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading pending approvals:', error);
        this.notificationService.showError(this.translate.instant('APPROVALS.ERROR_LOADING_PENDING'));
        this.isLoading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.approvalService.getApprovalSummary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: (error) => console.error('Error loading summary:', error)
    });
  }

  openApprovalDialog(approval: ApprovalRequest): void {
    const dialogRef = this.dialog.open(ApprovalActionDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { approval },
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPendingApprovals();
        this.loadSummary();
        this.approvalService.refreshCount();
      }
    });
  }

  getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'Urgent': return 'warn';
      case 'High': return 'warn';
      case 'Normal': return 'primary';
      case 'Low': return 'accent';
      default: return '';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  getProgressPercentage(approval: ApprovalRequest): number {
    if (!approval.totalLevels) {
      return 0;
    }
    return (approval.currentLevel / approval.totalLevels) * 100;
  }
}
