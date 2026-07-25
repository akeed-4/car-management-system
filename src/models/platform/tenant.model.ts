import { TenantStatus } from '../enums/platform.enums';

export interface TenantDto {
  id: number;
  code: string;
  name: string;
  subdomain: string;
  companyLegalName: string;
  adminEmail: string;
  adminFullName: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  language?: string | null;
  logoUrl?: string | null;
  status: TenantStatus;
  planId?: number | null;
  planName?: string | null;
  trialEndsAt?: string | null;
  createdAt: string;
  provisionedAt?: string | null;
  isActive: boolean;
  notes?: string | null;
}

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  companyLegalName: string;
  adminEmail: string;
  adminFullName: string;
  adminPassword: string;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  currency?: string | null;
  timezone?: string | null;
  language?: string | null;
  logoUrl?: string | null;
  planId: number;
  trialDays?: number | null;
  isActive: boolean;
  notes?: string | null;
}

export type UpdateTenantDto = Partial<Omit<CreateTenantDto, 'adminPassword'>> & {
  status?: TenantStatus;
};
