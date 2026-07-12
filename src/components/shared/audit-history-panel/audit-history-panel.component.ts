import { ChangeDetectionStrategy, Component, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditLogService, AuditLogEntry } from '../../../services/audit-log.service';

export interface AuditHistoryPanelData {
  entityName: string;
  entityId: number;
}

@Component({
  selector: 'app-audit-history-panel',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './audit-history-panel.component.html',
  styleUrl: './audit-history-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditHistoryPanelComponent implements OnInit {
  entries = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  error = signal(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AuditHistoryPanelData,
    private dialogRef: MatDialogRef<AuditHistoryPanelComponent>,
    private auditLogService: AuditLogService,
  ) {}

  ngOnInit(): void {
    this.auditLogService.getHistory(this.data.entityName, this.data.entityId).subscribe({
      next: (response) => {
        this.entries.set(response.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  actionIcon(action: string): string {
    switch (action) {
      case 'Create': return 'add_circle';
      case 'Update': return 'edit';
      case 'Delete': return 'delete';
      default: return 'info';
    }
  }
}
