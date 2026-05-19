import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApprovalService } from '../../../services/approval.service';
import { ApprovalRequest, ApprovalAction } from '../../../models/approval-request.model';
import { ToastService } from '../../../services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

interface DialogData {
  approval: ApprovalRequest;
}

@Component({
  selector: 'app-approval-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './approval-action-dialog.component.html',
  styleUrls: ['./approval-action-dialog.component.css']
})
export class ApprovalActionDialogComponent {
  private fb = inject(FormBuilder);
  private approvalService = inject(ApprovalService);
  private dialogRef = inject(MatDialogRef<ApprovalActionDialogComponent>);
  private toastService = inject(NotificationService);
  public data: DialogData = inject(MAT_DIALOG_DATA);
    private transalte = inject(TranslateService);

  actionForm: FormGroup;
  isProcessing = signal(false);

  constructor() {
    this.actionForm = this.fb.group({
      action: ['Approve', Validators.required],
      comment: ['']
    });
  }

  get approval(): ApprovalRequest {
    return this.data.approval;
  }

  getProgressPercentage(): number {
    return (this.approval.currentLevel / this.approval.totalLevels) * 100;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  async submitAction(): Promise<void> {
    if (this.actionForm.invalid) {
      this.toastService.showWarning('APPROVALS.FORM_INVALID');
      return;
    }

    const formValue = this.actionForm.value;
    const action: ApprovalAction = {
      approvalRequestId: this.approval.id,
      action: formValue.action,
      comment: formValue.comment || undefined
    };

    this.isProcessing.set(true);

    this.approvalService.processApproval(action).subscribe({
      next: () => {
        const actionKey = action.action === 'Approve' ? 'APPROVED' : 'REJECTED';
        this.toastService.showSuccess(`APPROVALS.DOCUMENT_${actionKey}`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error processing approval:', error);
       this.toastService.showError(this.transalte.instant('APPROVALS.ERROR_PROCESS_APPROVAL'));
        this.isProcessing.set(false);
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
