import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../services/platform.service';
import { NotificationService } from '../../../services/notification.service';
import { PlatformDashboardDto } from '../../../models/platform/dashboard.model';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, TranslateModule],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformDashboardComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  error = signal<string | null>(null);
  dashboard = signal<PlatformDashboardDto | null>(null);

  statCards = computed<StatCard[]>(() => {
    const d = this.dashboard();
    if (!d) return [];
    return [
      { title: 'PLATFORM.DASHBOARD.TOTAL_TENANTS', value: this.formatNumber(d.totalTenants), icon: 'business', color: '#2196f3', bgColor: '#e3f2fd' },
      { title: 'PLATFORM.DASHBOARD.ACTIVE_TENANTS', value: this.formatNumber(d.activeTenants), icon: 'check_circle', color: '#4caf50', bgColor: '#e8f5e9' },
      { title: 'PLATFORM.DASHBOARD.TRIAL_TENANTS', value: this.formatNumber(d.trialTenants), icon: 'hourglass_top', color: '#ff9800', bgColor: '#fff3e0' },
      { title: 'PLATFORM.DASHBOARD.EXPIRED_SUBSCRIPTIONS', value: this.formatNumber(d.expiredSubscriptions), icon: 'error_outline', color: '#f44336', bgColor: '#ffebee' },
      { title: 'PLATFORM.DASHBOARD.MONTHLY_REVENUE', value: this.formatCurrency(d.monthlyRevenue), icon: 'payments', color: '#9c27b0', bgColor: '#f3e5f5' },
      { title: 'PLATFORM.DASHBOARD.ANNUAL_REVENUE', value: this.formatCurrency(d.annualRevenue), icon: 'trending_up', color: '#00bcd4', bgColor: '#e0f7fa' },
      { title: 'PLATFORM.DASHBOARD.STORAGE_USAGE', value: this.formatStorage(d.storageUsageMb), icon: 'storage', color: '#795548', bgColor: '#efebe9' },
      { title: 'PLATFORM.DASHBOARD.ACTIVE_DOMAINS', value: this.formatNumber(d.activeDomains), icon: 'dns', color: '#607d8b', bgColor: '#eceff1' },
    ];
  });

  latestRegistrations = computed(() => this.dashboard()?.latestRegistrations ?? []);
  recentPayments = computed(() => this.dashboard()?.recentPayments ?? []);

  constructor() {
    this.loadDashboard();

    effect(() => {
      const err = this.error();
      if (err) {
        this.notificationService.showError(err);
      }
    });
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);
    this.platformService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('PLATFORM.DASHBOARD.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadDashboard();
  }

  private formatNumber(value: number): string {
    return (value ?? 0).toLocaleString('en-US');
  }

  private formatCurrency(value: number): string {
    return (value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatStorage(mb: number): string {
    if (!mb) return '0 MB';
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  }
}
