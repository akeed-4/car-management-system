import { ChangeDetectionStrategy, Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentAuditTrailService } from '../../../services/document-audit-trail.service';
import { DocumentAuditTrailEntryDto } from '../../../models/document-lifecycle.model';

export interface DocumentAuditTrailViewerData {
  entityName: string;
  entityId: number;
}

/**
 * Generic timeline popup for DocumentAuditTrail (Create/Approve/Reject/Cancel/Reopen), showing
 * user/date/IP/user-agent/reason. Distinct from the existing AuditHistoryPanelComponent, which
 * reads the older field-level AuditLog table -- this one reads the new lifecycle-action trail.
 * Reusable by any document screen; entityName/entityId are passed in via MAT_DIALOG_DATA.
 */
@Component({
  selector: 'app-document-audit-trail-viewer',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './document-audit-trail-viewer.component.html',
  styleUrl: './document-audit-trail-viewer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentAuditTrailViewerComponent implements OnInit {
  entries = signal<DocumentAuditTrailEntryDto[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DocumentAuditTrailViewerData,
    private dialogRef: MatDialogRef<DocumentAuditTrailViewerComponent>,
    private auditTrailService: DocumentAuditTrailService
  ) {}

  ngOnInit(): void {
    this.auditTrailService.getHistory(this.data.entityName, this.data.entityId).subscribe({
      next: (entries) => {
        this.entries.set(entries ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  actionIcon(action: string): string {
    switch (action) {
      case 'Create': return 'add_circle';
      case 'Approve': return 'check_circle';
      case 'Reject': return 'cancel';
      case 'Cancel': return 'block';
      case 'Reopen': return 'restart_alt';
      case 'Edit': return 'edit';
      case 'Delete': return 'delete';
      default: return 'info';
    }
  }
}
