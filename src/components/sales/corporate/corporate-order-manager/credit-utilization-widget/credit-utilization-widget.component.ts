import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-credit-utilization-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, TranslateModule],
  templateUrl: './credit-utilization-widget.component.html',
  styleUrls: ['./credit-utilization-widget.component.css']
})
export class CreditUtilizationWidgetComponent {
  @Input() approvedCreditLimit = 0;
  @Input() currentOutstandingBalance = 0;
  @Input() orderTotal = 0;

  get projectedBalance(): number {
    return this.currentOutstandingBalance + this.orderTotal;
  }

  get utilizationPercentage(): number {
    if (this.approvedCreditLimit <= 0) {
      return 0;
    }
    return Math.min((this.projectedBalance / this.approvedCreditLimit) * 100, 100);
  }

  get availableCredit(): number {
    return Math.max(this.approvedCreditLimit - this.currentOutstandingBalance, 0);
  }

  get exceedsLimit(): boolean {
    return this.projectedBalance > this.approvedCreditLimit;
  }

  get riskLevel(): 'low' | 'medium' | 'high' {
    if (this.exceedsLimit) {
      return 'high';
    }
    if (this.utilizationPercentage >= 75) {
      return 'medium';
    }
    return 'low';
  }

  get progressBarColor(): 'primary' | 'accent' | 'warn' {
    if (this.riskLevel === 'high') {
      return 'warn';
    }
    if (this.riskLevel === 'medium') {
      return 'accent';
    }
    return 'primary';
  }
}
