import { Component, inject, signal, OnInit } from '@angular/core';
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
import { DxDataGridModule } from 'devextreme-angular';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalRequest, PendingApprovalSummary } from '../../../models/approval-request.model';
import { ApprovalActionDialogComponent } from '../approval-action-dialog/approval-action-dialog.component';
import { ToastService } from '../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

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
    DxDataGridModule
  ],
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.css']
})
export class PendingApprovalsComponent implements OnInit {
  private approvalService = inject(ApprovalService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  pendingApprovals = signal<ApprovalRequest[]>([]);
  summary = signal<PendingApprovalSummary | null>(null);
  isLoading = signal(false);
  selectedTab = signal(0);

  constructor() {
    this.reviewClick = this.reviewClick.bind(this);
  }

  ngOnInit(): void {
    this.loadPendingApprovals();
    this.loadSummary();
  }

  reviewClick(e: any): void {
    this.openApprovalDialog(e.row.data);
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
