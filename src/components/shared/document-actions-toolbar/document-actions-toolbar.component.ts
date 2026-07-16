import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HasPermissionDirective } from '../permission.directive';
import { DocumentLifecycleAction, DocumentStatus } from '../../../models/document-lifecycle.model';

/**
 * Generic action bar for any lifecycle-enabled document: Approve/Reject/Cancel/Reopen/Delete/
 * Audit Trail, shown per current Status and gated by the caller's permission-key prefix
 * (e.g. "grn" -> grn.approve/grn.reject/...). The caller owns Save/Save Draft/Print, since
 * those are form-specific; this toolbar only covers the lifecycle transitions + audit trail.
 */
@Component({
  selector: 'app-document-actions-toolbar',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatIconModule, HasPermissionDirective],
  templateUrl: './document-actions-toolbar.component.html',
  styleUrl: './document-actions-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentActionsToolbarComponent {
  @Input({ required: true }) status!: DocumentStatus;
  /** Permission-key prefix for this module, e.g. "grn" -> grn.approve, grn.reject, ... */
  @Input({ required: true }) permissionPrefix!: string;
  @Input() showDelete = false;

  @Output() action = new EventEmitter<DocumentLifecycleAction>();
  @Output() deleteRequested = new EventEmitter<void>();
  @Output() auditTrailRequested = new EventEmitter<void>();

  get canApprove(): boolean { return this.status === 'Draft'; }
  get canReject(): boolean { return this.status === 'Draft'; }
  get canCancel(): boolean { return this.status === 'Approved'; }
  get canReopen(): boolean { return this.status === 'Approved' || this.status === 'Rejected' || this.status === 'Cancelled'; }
  get canDelete(): boolean { return this.showDelete && this.status === 'Draft'; }

  perm(suffix: string): string {
    return `${this.permissionPrefix}.${suffix}`;
  }
}
