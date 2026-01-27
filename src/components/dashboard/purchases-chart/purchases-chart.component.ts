import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { PurchasesChartData } from '../../../models/dashboard.model';

@Component({
  selector: 'app-purchases-chart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    DxChartModule
  ],
  templateUrl: './purchases-chart.component.html',
  styleUrls: ['./purchases-chart.component.css']
})
export class PurchasesChartComponent implements OnInit, OnChanges {
  @Input() data: PurchasesChartData[] = [];
  @Input() loading: boolean = false;

  chartType: 'line' | 'bar' | 'area' = 'bar';

  ngOnInit(): void {}

  ngOnChanges(): void {
    // Chart will auto-update when data changes
  }

  /**
   * Change chart type
   */
  changeChartType(type: 'line' | 'bar' | 'area'): void {
    this.chartType = type;
  }

  /**
   * Customize point appearance
   */
  customizePoint(pointInfo: any) {
    if (pointInfo.seriesName === 'Cost' && pointInfo.value > 100000) {
      return { color: '#f44336' };
    }
    return null;
  }

  /**
   * Customize tooltip
   */
  customizeTooltip(pointInfo: any) {
    return {
      html: `
        <div class="custom-tooltip">
          <strong>${pointInfo.argument}</strong><br/>
          ${pointInfo.seriesName}: ${pointInfo.valueText}<br/>
          Units: ${pointInfo.point.data.units}
        </div>
      `
    };
  }

  /**
   * Format currency values
   */
  formatCurrency(value: any): string {
    return `$${value.value.toLocaleString()}`;
  }
}
