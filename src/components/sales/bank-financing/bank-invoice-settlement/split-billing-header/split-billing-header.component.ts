import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { SplitBillingSummary } from '../../../../../models/bank-financing/bank-invoice.model';

@Component({
  selector: 'app-split-billing-header',
  standalone: true,
  imports: [CommonModule, MatCardModule, TranslateModule],
  templateUrl: './split-billing-header.component.html',
  styleUrls: ['./split-billing-header.component.css']
})
export class SplitBillingHeaderComponent {
  @Input() billing: SplitBillingSummary | null = null;
}
