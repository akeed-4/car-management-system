export interface PlanLimitDto {
  id?: number;
  metricKey: string;
  maxValue: number | null; // null == unlimited
}

export interface PlanFeatureDto {
  id?: number;
  featureKey: string;
  nameAr: string;
  nameEn: string;
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
  'Accounting', 'Inventory', 'Sales', 'Purchases', 'POS', 'CRM', 'Reports', 'Notifications',
] as const;

/** FeatureKey -> (nameEn, nameAr) -- mirrors FeatureNames in SubscriptionPlanSeeder.cs. Used to
 *  fill PlanFeatureDto.nameEn/nameAr when building a plan from PLAN_FEATURE_KEYS on this side. */
export const PLAN_FEATURE_NAMES: Record<string, { nameEn: string; nameAr: string }> = {
  Accounting: { nameEn: 'Accounting', nameAr: 'المحاسبة' },
  Inventory: { nameEn: 'Inventory', nameAr: 'المخزون' },
  Sales: { nameEn: 'Sales', nameAr: 'المبيعات' },
  Purchases: { nameEn: 'Purchases', nameAr: 'المشتريات' },
  POS: { nameEn: 'Point of Sale', nameAr: 'نقطة البيع' },
  CRM: { nameEn: 'CRM', nameAr: 'إدارة علاقات العملاء' },
  Reports: { nameEn: 'Reports', nameAr: 'التقارير' },
  Notifications: { nameEn: 'Notifications', nameAr: 'الإشعارات' },
};
