import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DocumentStatus, DOCUMENT_STATUS_COLORS } from '../../../models/document-lifecycle.model';

/** Generic status pill for any document using the shared lifecycle (Draft/Approved/Rejected/Cancelled/Closed). */
@Component({
  selector: 'app-document-status-badge',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './document-status-badge.component.html',
  styleUrl: './document-status-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentStatusBadgeComponent {
  @Input({ required: true }) status!: DocumentStatus;

  get color(): string {
    return DOCUMENT_STATUS_COLORS[this.status] ?? '#9e9e9e';
  }

  get translateKey(): string {
    return 'DOCUMENT_LIFECYCLE.STATUS_' + (this.status ?? 'DRAFT').toUpperCase();
  }
}
