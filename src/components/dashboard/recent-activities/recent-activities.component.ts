import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RecentActivity } from '../../../models/dashboard.model';

@Component({
  selector: 'app-recent-activities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './recent-activities.component.html',
  styleUrls: ['./recent-activities.component.css']
})
export class RecentActivitiesComponent implements OnInit {
  @Input() data: RecentActivity[] = [];
  @Input() loading: boolean = false;

  ngOnInit(): void {}

  /**
   * Get activity icon
   */
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'sale': 'point_of_sale',
      'purchase': 'shopping_cart',
      'payment': 'payment',
      'delivery': 'local_shipping',
      'maintenance': 'build',
      'customer': 'person_add',
      'inventory': 'inventory',
      'return': 'keyboard_return'
    };
    return icons[type.toLowerCase()] || 'info';
  }

  /**
   * Get activity color
   */
  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'sale': '#4caf50',
      'purchase': '#2196f3',
      'payment': '#ff9800',
      'delivery': '#9c27b0',
      'maintenance': '#f44336',
      'customer': '#00bcd4',
      'inventory': '#673ab7',
      'return': '#ff5722'
    };
    return colors[type.toLowerCase()] || '#757575';
  }

  /**
   * Get time ago string
   */
  getTimeAgo(timestamp: string): string {
    const now = new Date().getTime();
    const activityTime = new Date(timestamp).getTime();
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  /**
   * Format amount
   */
  formatAmount(amount: number): string {
    return `$${amount.toLocaleString()}`;
  }

  /**
   * Get user initials
   */
  getUserInitials(user: string): string {
    return user
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
