export interface PlanLimitDto {
  id?: number;
  metricKey: string;
  maxValue: number | null; // null == unlimited
}

export interface PlanFeatureDto {
  id?: number;
  featureKey: string;
  isEnabled: boolean;
}

export interface SubscriptionPlanDto {
  id: number;
  code: string;
  name: string;
  priceMonthly: number;
  priceQuarterly: number;
  priceSemiAnnual: number;
  priceYearly: number;
  priceLifetime?: number | null;
  isActive: boolean;
  sortOrder: number;
  limits: PlanLimitDto[];
  features: PlanFeatureDto[];
}

export type CreateSubscriptionPlanDto = Omit<SubscriptionPlanDto, 'id'>;
export type UpdateSubscriptionPlanDto = Partial<CreateSubscriptionPlanDto>;

/** Canonical MetricKey/FeatureKey values -- mirrors CarERP.Core/Constants/PlanMetricKeys.cs and
 *  PlanFeatureKeys.cs. New keys can still be added purely as data; these exist so this UI never
 *  repeats the raw string. */
export const PLAN_METRIC_KEYS = [
  'Users', 'Branches', 'Warehouses', 'PosTerminals', 'Cars', 'Customers', 'Suppliers',
  'Invoices', 'MonthlyTransactions', 'StorageMb', 'ApiCallsPerDay', 'Attachments', 'Reports',
] as const;

export const PLAN_FEATURE_KEYS = [
  'Accounting', 'Inventory', 'Sales', 'Purchases', 'POS', 'CRM', 'Payroll', 'HR', 'Assets',
  'Manufacturing', 'Reports', 'AI', 'Notifications', 'MobileApp', 'Api',
] as const;
