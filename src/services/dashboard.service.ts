import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  DashboardSummary,
  SalesChartData,
  PurchasesChartData,
  CustomerMetric,
  PerformanceMetric,
  RecentActivity,
  SalesByCategory,
  TopSalesperson,
  MonthlyComparison,
  InventoryStatus,
  DashboardFilter
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.origin}api/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get dashboard summary statistics
   */
  getDashboardSummary(filter?: DashboardFilter): Observable<DashboardSummary> {
    const params = this.buildParams(filter);
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`, { params });
  }

  /**
   * Get sales chart data
   */
  getSalesChartData(filter?: DashboardFilter): Observable<SalesChartData[]> {
    const params = this.buildParams(filter);
    return this.http.get<SalesChartData[]>(`${this.apiUrl}/sales-chart`, { params });
  }

  /**
   * Get purchases chart data
   */
  getPurchasesChartData(filter?: DashboardFilter): Observable<PurchasesChartData[]> {
    const params = this.buildParams(filter);
    return this.http.get<PurchasesChartData[]>(`${this.apiUrl}/purchases-chart`, { params });
  }

  /**
   * Get top customers
   */
  getTopCustomers(limit: number = 10, filter?: DashboardFilter): Observable<CustomerMetric[]> {
    const params = this.buildParams(filter);
    params.set('limit', limit.toString());
    return this.http.get<CustomerMetric[]>(`${this.apiUrl}/top-customers`, { params });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(filter?: DashboardFilter): Observable<PerformanceMetric[]> {
    const params = this.buildParams(filter);
    return this.http.get<PerformanceMetric[]>(`${this.apiUrl}/performance`, { params });
  }

  /**
   * Get recent activities
   */
  getRecentActivities(limit: number = 20, filter?: DashboardFilter): Observable<RecentActivity[]> {
    const params = this.buildParams(filter);
    params.set('limit', limit.toString());
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/activities`, { params });
  }

  /**
   * Get sales by category
   */
  getSalesByCategory(filter?: DashboardFilter): Observable<SalesByCategory[]> {
    const params = this.buildParams(filter);
    return this.http.get<SalesByCategory[]>(`${this.apiUrl}/sales-by-category`, { params });
  }

  /**
   * Get top salespersons
   */
  getTopSalespersons(limit: number = 10, filter?: DashboardFilter): Observable<TopSalesperson[]> {
    const params = this.buildParams(filter);
    params.set('limit', limit.toString());
    return this.http.get<TopSalesperson[]>(`${this.apiUrl}/top-salespersons`, { params });
  }

  /**
   * Get monthly comparison data
   */
  getMonthlyComparison(filter?: DashboardFilter): Observable<MonthlyComparison[]> {
    const params = this.buildParams(filter);
    return this.http.get<MonthlyComparison[]>(`${this.apiUrl}/monthly-comparison`, { params });
  }

  /**
   * Get inventory status
   */
  getInventoryStatus(filter?: DashboardFilter): Observable<InventoryStatus> {
    const params = this.buildParams(filter);
    return this.http.get<InventoryStatus>(`${this.apiUrl}/inventory-status`, { params });
  }

  /**
   * Build HTTP params from filter
   */
  private buildParams(filter?: DashboardFilter): HttpParams {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.startDate) {
        params = params.set('startDate', filter.startDate.toISOString());
      }
      if (filter.endDate) {
        params = params.set('endDate', filter.endDate.toISOString());
      }
      if (filter.branchId) {
        params = params.set('branchId', filter.branchId.toString());
      }
      if (filter.period) {
        params = params.set('period', filter.period);
      }
    }
    
    return params;
  }
}
