import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PerformanceMetric } from '../../../models/dashboard.model';

@Component({
  selector: 'app-performance-metrics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './performance-metrics.component.html',
  styleUrls: ['./performance-metrics.component.css']
})
export class PerformanceMetricsComponent implements OnInit {
  @Input() data: PerformanceMetric[] = [];
  @Input() loading: boolean = false;

  ngOnInit(): void {}

  /**
   * Get progress percentage
   */
  getProgressPercentage(metric: PerformanceMetric): number {
    if (metric.target === 0) return 0;
    return Math.min((metric.current / metric.target) * 100, 100);
  }

  /**
   * Get progress color based on percentage
   */
  getProgressColor(percentage: number): string {
    if (percentage >= 90) return 'accent';
    if (percentage >= 70) return 'primary';
    return 'warn';
  }

  /**
   * Get status icon
   */
  getStatusIcon(metric: PerformanceMetric): string {
    const percentage = this.getProgressPercentage(metric);
    if (percentage >= 100) return 'check_circle';
    if (percentage >= 90) return 'trending_up';
    if (percentage >= 70) return 'remove';
    return 'trending_down';
  }

  /**
   * Get status color
   */
  getStatusColor(metric: PerformanceMetric): string {
    const percentage = this.getProgressPercentage(metric);
    if (percentage >= 100) return '#4caf50';
    if (percentage >= 90) return '#2196f3';
    if (percentage >= 70) return '#ff9800';
    return '#f44336';
  }

  /**
   * Format number with K/M suffix
   */
  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  /**
   * Get metric icon
   */
  getMetricIcon(metric: string): string {
    const icons: { [key: string]: string } = {
      'sales': 'shopping_cart',
      'revenue': 'attach_money',
      'profit': 'trending_up',
      'customers': 'people',
      'inventory': 'inventory_2',
      'orders': 'receipt_long'
    };
    return icons[metric.toLowerCase()] || 'assessment';
  }
}
