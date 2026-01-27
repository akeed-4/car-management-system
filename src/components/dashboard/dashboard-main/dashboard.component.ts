
import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { CurrencyPipe, SlicePipe, CommonModule } from '@angular/common';
import { SalesService } from '../../../services/sales.service';
import { BarChartComponent } from '../../shared/bar-chart/bar-chart.component';
import { PieChartComponent } from '../../shared/pie-chart/pie-chart.component';
import { RequestedCarService } from '../../../services/requested-car.service';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../../services/expense.service';
import { Car, CarStatus } from '../../../models/car.model';
import { AlertsService } from '../../../services/alerts.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

// Import new dashboard widgets
import { AnalyticsSummaryComponent } from '../analytics-summary/analytics-summary.component';
import { SalesChartComponent } from '../sales-chart/sales-chart.component';
import { PurchasesChartComponent } from '../purchases-chart/purchases-chart.component';
import { CustomerTrackingComponent } from '../customer-tracking/customer-tracking.component';
import { PerformanceMetricsComponent } from '../performance-metrics/performance-metrics.component';
import { RecentActivitiesComponent } from '../recent-activities/recent-activities.component';

// Import dashboard service and models
import { DashboardService } from '../../../services/dashboard.service';
import {
  DashboardSummary,
  SalesChartData,
  PurchasesChartData,
  CustomerMetric,
  PerformanceMetric,
  RecentActivity
} from '../../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    SlicePipe,
    BarChartComponent,
    PieChartComponent,
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    AnalyticsSummaryComponent,
    SalesChartComponent,
    PurchasesChartComponent,
    CustomerTrackingComponent,
    PerformanceMetricsComponent,
    RecentActivitiesComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private salesService = inject(SalesService);
  // Fix: Explicitly type the injected service to resolve 'unknown' type inference issue.
  private requestedCarService: RequestedCarService = inject(RequestedCarService);
  private expenseService = inject(ExpenseService);
  private alertsService = inject(AlertsService);
  private dashboardService = inject(DashboardService);

  // Dashboard data signals
  dashboardSummary = signal<DashboardSummary | null>(null);
  salesChartData = signal<SalesChartData[]>([]);
  purchasesChartData = signal<PurchasesChartData[]>([]);
  topCustomers = signal<CustomerMetric[]>([]);
  performanceMetrics = signal<PerformanceMetric[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  loading = signal<boolean>(false);

  // Period filter
  selectedPeriod = signal<'week' | 'month' | 'quarter' | 'year'>('month');
  periods: Array<{value: 'week' | 'month' | 'quarter' | 'year', label: string}> = [
    { value: 'week' as const, label: 'This Week' },
    { value: 'month' as const, label: 'This Month' },
    { value: 'quarter' as const, label: 'This Quarter' },
    { value: 'year' as const, label: 'This Year' }
  ];
  
  // Access cars and quantities separately
  cars = this.inventoryService.cars$;
  upcomingAlerts = this.alertsService.upcomingAlerts;
  
  availableCarsCount = computed(() => {
    return this.cars().filter(c => c.status === 'Available').length;
  });

  requestedCarsCount = computed(() => this.requestedCarService.requestedCars$().length);
  
  soldCarsCount = computed(() => this.salesService.invoices$().reduce((sum, inv) => inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0) + sum ,0));
  
  totalInventoryValue = computed(() => {
    return this.cars().reduce((sum, car) => sum + car.totalCost * car.quantity, 0);
  });
  
  // New computed signal for total expenses
  totalExpenses = computed(() => this.expenseService.expenses$().reduce((sum, expense) => sum + expense.amount, 0));

  salesByManufacturer = computed(() => {
    const sales = this.salesService.invoices$();
    const cars = this.inventoryService.cars$();
    
    const salesData = new Map<string, number>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const car = cars.find(c => c.id === item.carId);
        if (car) {
          const currentSales = salesData.get(car.make) || 0;
          salesData.set(car.make, currentSales + item.lineTotal);
        }
      }
    }

    return Array.from(salesData.entries()).map(([name, value]) => ({ name, value }));
  });

  inventoryStatusDistribution = computed(() => {
    const cars = this.cars();
    const statusCounts = new Map<CarStatus, number>();

    for (const car of cars) {
      const currentCount = statusCounts.get(car.status) || 0;
      statusCounts.set(car.status, currentCount + car.quantity);
    }

    // Ensure all possible statuses are represented for chart consistency, even if 0
    const allStatuses: CarStatus[] = ['Available', 'Reserved', 'Sold', 'In Maintenance'];
    const finalDistribution = allStatuses
        .map(status => ({
            name: status,
            value: statusCounts.get(status) ?? 0
        }))
        .filter(entry => entry.value > 0); // Filter out entries with 0 value for cleaner chart

    return finalDistribution;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loading.set(true);

    // Load dashboard summary
    this.dashboardService.getDashboardSummary({ period: this.selectedPeriod() }).subscribe({
      next: (data) => this.dashboardSummary.set(data),
      error: (err) => console.error('Error loading dashboard summary:', err)
    });

    // Load sales chart data
    this.dashboardService.getSalesChartData({ period: this.selectedPeriod() }).subscribe({
      next: (data) => this.salesChartData.set(data),
      error: (err) => console.error('Error loading sales chart:', err)
    });

    // Load purchases chart data
    this.dashboardService.getPurchasesChartData({ period: this.selectedPeriod() }).subscribe({
      next: (data) => this.purchasesChartData.set(data),
      error: (err) => console.error('Error loading purchases chart:', err)
    });

    // Load top customers
    this.dashboardService.getTopCustomers(10).subscribe({
      next: (data) => this.topCustomers.set(data),
      error: (err) => console.error('Error loading top customers:', err)
    });

    // Load performance metrics
    this.dashboardService.getPerformanceMetrics({ period: this.selectedPeriod() }).subscribe({
      next: (data) => this.performanceMetrics.set(data),
      error: (err) => console.error('Error loading performance metrics:', err)
    });

    // Load recent activities
    this.dashboardService.getRecentActivities(20).subscribe({
      next: (data) => {
        this.recentActivities.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading recent activities:', err);
        this.loading.set(false);
      }
    });
  }

  /**
   * Handle period change
   */
  onPeriodChange(period: 'week' | 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod.set(period);
    this.loadDashboardData();
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }
}
