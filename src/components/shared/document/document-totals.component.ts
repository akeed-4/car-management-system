import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { DocumentTotalsRow } from './document-ui.models';

/**
 * Shared document totals block -- ONE implementation for every document type
 * (sales/purchase invoices, orders, quotations, credit/debit notes, ...).
 *
 * Config-driven and deliberately dumb: rows are described by the screen
 * (already conditional, already formatted with the screen's own currency pipe),
 * and this component only owns presentation -- hierarchy, separators, emphasis
 * of `total` rows, RTL-safe numeric alignment.
 */
@Component({
  selector: 'app-document-totals',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatIconModule],
  templateUrl: './document-totals.component.html',
  styleUrl: './document-totals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentTotalsComponent {
  @Input({ required: true }) rows: DocumentTotalsRow[] = [];
  /** Optional section title translation key (e.g. INVOICE.INVOICE_SUMMARY). */
  @Input() titleKey?: string;

  kindClass(row: DocumentTotalsRow): string {
    return row.kind ? `doc-total-row-${row.kind}` : 'doc-total-row-default';
  }

  labelFor(row: DocumentTotalsRow): string {
    return row.label ?? '';
  }
}
