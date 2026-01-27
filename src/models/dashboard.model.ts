/**
 * Dashboard Models and Interfaces
 */

export interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  totalRevenue: number;
  totalProfit: number;
  totalCustomers: number;
  totalVehicles: number;
  pendingOrders: number;
  completedOrders: number;
}

export interface SalesChartData {
  period: string;
  sales: number;
  revenue: number;
  profit: number;
  date: Date;
}

export interface PurchasesChartData {
  period: string;
  purchases: number;
  cost: number;
  date: Date;
}

export interface CustomerMetric {
  id: number;
  name: string;
  email: string;
  purchases: number;
  totalSpent: number;
  lastPurchase: string;
  status: 'active' | 'inactive' | 'vip';
}

export interface PerformanceMetric {
  metric: string;
  current: number;
  target: number;
  period: string;
  variance: number;
}

export interface RecentActivity {
  id: number;
  type: 'sale' | 'purchase' | 'customer' | 'payment' | 'delivery' | 'maintenance' | 'inventory' | 'return';
  description: string;
  amount?: number;
  timestamp: string;
  user: string;
}

export interface SalesByCategory {
  category: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface TopSalesperson {
  id: number;
  name: string;
  salesCount: number;
  revenue: number;
  commission: number;
  avatar?: string;
}

export interface MonthlyComparison {
  month: string;
  currentYear: number;
  previousYear: number;
  growth: number;
}

export interface InventoryStatus {
  totalVehicles: number;
  available: number;
  sold: number;
  reserved: number;
  lowStock: number;
}

export interface DashboardFilter {
  startDate?: Date;
  endDate?: Date;
  branchId?: number;
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface ChartOptions {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}
