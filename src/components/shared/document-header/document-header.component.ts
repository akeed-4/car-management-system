import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DocumentStatusBadgeComponent } from '../document-status-badge/document-status-badge.component';
import { BaseDocumentDto } from '../../../models/document-lifecycle.model';

/**
 * Generic header strip for any lifecycle-enabled document: number, status badge,
 * created/approved/rejected/cancelled by + when. Reusable across every module once
 * its backend adopts BaseDocumentEntity/BaseDocumentDto -- wired into GRN this phase.
 */
@Component({
  selector: 'app-document-header',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatCardModule, MatIconModule, DocumentStatusBadgeComponent],
  templateUrl: './document-header.component.html',
  styleUrl: './document-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentHeaderComponent {
  @Input({ required: true }) document!: BaseDocumentDto;
  /** Maps user IDs to display names -- caller resolves via its own user list/lookup. */
  @Input() userNames: Record<number, string> = {};

  nameFor(userId?: number): string {
    if (!userId) return '';
    return this.userNames[userId] ?? ('#' + userId);
  }
}
