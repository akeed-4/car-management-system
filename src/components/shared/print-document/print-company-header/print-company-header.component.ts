import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PrintPartyInfo } from '../../../../models/print-document.model';

/** Logo, company name, branch/store, address, VAT/CR, phone/email/website. Reads
 * PrintDocumentModel.company (a normalized PrintPartyInfo) plus branch/store labels, which the
 * adapter resolves via CurrentSettingService and passes in directly rather than this component
 * reaching into services itself -- keeps it a pure presentational leaf. */
@Component({
  selector: 'app-print-company-header',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './print-company-header.component.html',
  styleUrl: './print-company-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintCompanyHeaderComponent {
  @Input({ required: true }) company!: PrintPartyInfo;
  @Input() branch?: string;
  @Input() store?: string;
}
