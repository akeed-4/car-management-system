import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { CustomerMetric } from '../../../models/dashboard.model';

@Component({
  selector: 'app-customer-tracking',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    TranslateModule
  ],
  templateUrl: './customer-tracking.component.html',
  styleUrls: ['./customer-tracking.component.css']
})
export class CustomerTrackingComponent implements OnInit {
  @Input() data: CustomerMetric[] = [];
  @Input() loading: boolean = false;

  displayedColumns: string[] = ['rank', 'name', 'purchases', 'totalSpent', 'lastPurchase', 'status'];

  ngOnInit(): void {}

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'active': 'primary',
      'inactive': 'warn',
      'vip': 'accent'
    };
    return statusColors[status.toLowerCase()] || 'default';
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return `$${amount.toLocaleString()}`;
  }

  /**
   * Get customer initials
   */
  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Get avatar color based on name
   */
  getAvatarColor(name: string): string {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
      '#2196f3', '#00bcd4', '#009688', '#4caf50',
      '#ff9800', '#ff5722'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  /**
   * Format date
   */
  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString();
  }
}
