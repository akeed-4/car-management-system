import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardSummary } from '../../../models/dashboard.model';

@Component({
  selector: 'app-analytics-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './analytics-summary.component.html',
  styleUrls: ['./analytics-summary.component.css']
})
export class AnalyticsSummaryComponent {
  @Input() data!: DashboardSummary;
  @Input() loading: boolean = false;

  /**
   * Get summary cards configuration
   */
  getSummaryCards() {
    if (!this.data) return [];
    
    return [
      {
        title: 'DASHBOARD.TOTAL_SALES',
        value: this.data.totalSales,
        icon: 'shopping_cart',
        color: '#4caf50',
        bgColor: '#e8f5e9',
        trend: '+12%'
      },
      {
        title: 'DASHBOARD.TOTAL_PURCHASES',
        value: this.data.totalPurchases,
        icon: 'local_mall',
        color: '#2196f3',
        bgColor: '#e3f2fd',
        trend: '+8%'
      },
      {
        title: 'DASHBOARD.TOTAL_REVENUE',
        value: this.data.totalRevenue,
        icon: 'attach_money',
        color: '#ff9800',
        bgColor: '#fff3e0',
        trend: '+15%',
        isCurrency: true
      },
      {
        title: 'DASHBOARD.TOTAL_PROFIT',
        value: this.data.totalProfit,
        icon: 'trending_up',
        color: '#9c27b0',
        bgColor: '#f3e5f5',
        trend: '+20%',
        isCurrency: true
      },
      {
        title: 'DASHBOARD.TOTAL_CUSTOMERS',
        value: this.data.totalCustomers,
        icon: 'people',
        color: '#00bcd4',
        bgColor: '#e0f7fa',
        trend: '+5%'
      },
      {
        title: 'DASHBOARD.TOTAL_VEHICLES',
        value: this.data.totalVehicles,
        icon: 'directions_car',
        color: '#f44336',
        bgColor: '#ffebee',
        trend: '-3%'
      },
      {
        title: 'DASHBOARD.PENDING_ORDERS',
        value: this.data.pendingOrders,
        icon: 'schedule',
        color: '#ff5722',
        bgColor: '#fbe9e7',
        trend: '+2%'
      },
      {
        title: 'DASHBOARD.COMPLETED_ORDERS',
        value: this.data.completedOrders,
        icon: 'check_circle',
        color: '#8bc34a',
        bgColor: '#f1f8e9',
        trend: '+18%'
      }
    ];
  }

  /**
   * Format number with commas
   */
  formatNumber(value: number): string {
    return value?.toLocaleString('en-US') || '0';
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return value?.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  }
}
