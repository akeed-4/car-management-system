import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentLifecycleAction } from '../../../models/document-lifecycle.model';

export interface ApprovalActionDialogData {
  action: DocumentLifecycleAction;
  documentNumber: string;
  /** Reject/Cancel require a reason; Approve/Reopen don't. */
  requireReason: boolean;
}

export interface ApprovalActionDialogResult {
  confirmed: true;
  reason?: string;
}

/**
 * Generic Approve/Reject/Cancel/Reopen confirmation dialog. Reusable by any document screen
 * that wires the shared lifecycle -- the caller decides which action to open with and what
 * to do with the confirmed reason; this dialog has no knowledge of any specific document type.
 */
@Component({
  selector: 'app-approval-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './approval-action-dialog.component.html',
  styleUrl: './approval-action-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApprovalActionDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApprovalActionDialogComponent, ApprovalActionDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: ApprovalActionDialogData
  ) {
    this.form = this.fb.group({
      reason: ['', data.requireReason ? [Validators.required, Validators.minLength(3)] : []]
    });
  }

  get titleKey(): string {
    return 'DOCUMENT_LIFECYCLE.ACTION_' + this.data.action.toUpperCase() + '_TITLE';
  }

  get confirmKey(): string {
    return 'DOCUMENT_LIFECYCLE.ACTION_' + this.data.action.toUpperCase();
  }

  get iconName(): string {
    switch (this.data.action) {
      case 'approve': return 'check_circle';
      case 'reject': return 'cancel';
      case 'cancel': return 'block';
      case 'reopen': return 'restart_alt';
    }
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({ confirmed: true, reason: this.form.value.reason || undefined });
  }

  close(): void {
    this.dialogRef.close();
  }
}
