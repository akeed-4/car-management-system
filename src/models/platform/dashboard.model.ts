export interface PlatformDashboardDto {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredSubscriptions: number;
  monthlyRevenue: number;
  annualRevenue: number;
  storageUsageMb: number;
  activeDomains: number;
  latestRegistrations: TenantSummaryDto[];
  recentPayments: PaymentSummaryDto[];
}

export interface TenantSummaryDto {
  id: number;
  name: string;
  subdomain: string;
  planName: string;
  createdAt: string;
}

export interface PaymentSummaryDto {
  id: number;
  tenantName: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string | null;
}
