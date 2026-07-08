import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { OrderFulfillmentProgress } from '../../../../../models/corporate/corporate-dispatch.model';

@Component({
  selector: 'app-order-fulfillment-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, TranslateModule],
  templateUrl: './order-fulfillment-summary.component.html',
  styleUrls: ['./order-fulfillment-summary.component.css']
})
export class OrderFulfillmentSummaryComponent {
  @Input() progress: OrderFulfillmentProgress | null = null;

  get deliveredPercentage(): number {
    if (!this.progress || this.progress.totalOrdered <= 0) {
      return 0;
    }
    return (this.progress.totalDelivered / this.progress.totalOrdered) * 100;
  }
}
