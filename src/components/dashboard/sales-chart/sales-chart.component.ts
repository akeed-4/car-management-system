import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { SalesChartData } from '../../../models/dashboard.model';

@Component({
  selector: 'app-sales-chart',
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
  templateUrl: './sales-chart.component.html',
  styleUrls: ['./sales-chart.component.css']
})
export class SalesChartComponent implements OnInit, OnChanges {
  @Input() data: SalesChartData[] = [];
  @Input() loading: boolean = false;

  chartType: 'line' | 'bar' | 'area' = 'area';

  constructor(private translate: TranslateService) {}

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
    if (pointInfo.value > pointInfo.data.revenue * 0.8) {
      return { color: '#4caf50' };
    }
    return null;
  }

  /**
   * Customize tooltip
   */
  customizeTooltip = (pointInfo: any) => {
    const salesLabel = this.translate.instant('DASHBOARD.SALES');
    const revenueLabel = this.translate.instant('DASHBOARD.REVENUE');
    return {
      html: `
        <div class="custom-tooltip">
          <strong>${pointInfo.argument}</strong><br/>
          ${salesLabel}: ${pointInfo.value.toLocaleString()}<br/>
          ${revenueLabel}: ${pointInfo.point.data.revenue.toLocaleString()}
        </div>
      `
    };
  }

  /**
   * Customize value axis label
   */
  customizeValueLabel = (e: any) => {
    return e.value.toLocaleString();
  }
}
