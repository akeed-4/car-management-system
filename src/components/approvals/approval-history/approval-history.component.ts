import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalHistory } from '@/src/models/approval-request.model';
import { DocumentType } from '@/src/models/approval-workflow.model';

@Component({
  selector: 'app-approval-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './approval-history.component.html',
  styleUrl: './approval-history.component.css'
})
export class ApprovalHistoryComponent implements OnInit {
  documentType = signal<DocumentType | undefined>(undefined);
  documentId = signal<number>(0);
  history = signal<ApprovalHistory[]>([]);
  isLoading = signal<boolean>(false);

  constructor(private approvalService: ApprovalService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Initialize the component with document information
   * Call this method from parent component after passing inputs
   */
  initialize(documentType: DocumentType, documentId: number): void {
    this.documentType.set(documentType);
    this.documentId.set(documentId);
    this.loadHistory();
  }

  /**
   * Load approval history from the API
   */
  private loadHistory(): void {
    if (!this.documentType() || !this.documentId()) {
      return;
    }

    this.isLoading.set(true);
    this.approvalService.getApprovalHistory(this.documentType()!, this.documentId())
      .subscribe({
        next: (data) => {
          this.history.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading approval history:', error);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Refresh the approval history
   */
  refresh(): void {
    this.loadHistory();
  }

  /**
   * Get the appropriate icon for an action
   */
  getActionIcon(action: string): string {
    switch (action) {
      case 'Approved':
        return 'check_circle';
      case 'Rejected':
        return 'cancel';
      case 'Returned':
        return 'undo';
      case 'Cancelled':
        return 'block';
      case 'Submitted':
        return 'send';
      case 'Delegated':
        return 'forward';
      default:
        return 'help';
    }
  }

  /**
   * Get the color for an action chip
   */
  getActionColor(action: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (action) {
      case 'Approved':
        return 'primary';
      case 'Rejected':
      case 'Cancelled':
        return 'warn';
      default:
        return 'accent';
    }
  }

  /**
   * Format a date string
   */
  formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Check if there is any history
   */
  hasHistory(): boolean {
    return this.history().length > 0;
  }

  /**
   * Get the status of the overall approval process
   */
  getOverallStatus(): string {
    const historyData = this.history();
    
    if (historyData.length === 0) {
      return 'No history';
    }

    const hasRejected = historyData.some(h => h.action === 'Rejected');
    if (hasRejected) {
      return 'Rejected';
    }

    const allApproved = historyData.every(h => h.action === 'Approved');
    if (allApproved) {
      return 'Approved';
    }

    return 'In Progress';
  }
}
