import { TenantStatus } from '../enums/platform.enums';

/** One row per company the caller belongs to -- GET /api/platform/my/tenants,
 *  GET /api/platform/my/tenants/current. See CarERP.Core/DTOs/Platform/TenantMembershipDto.cs. */
export interface TenantMembershipDto {
  tenantId: number;
  tenantCode: string;
  tenantName: string;
  tenantStatus: TenantStatus;
  role: string;
  subscriptionId?: number | null;
  planId?: number | null;
  planName?: string | null;
  isCurrent: boolean;
  companyLegalName?: string | null;
  currency?: string | null;
  language?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
}

/** POST /api/platform/my/tenants/{id}/select. Carries a reissued token+refresh-token pair so the
 *  frontend can switch companies without a full re-login -- same shape as AppLoginResponse plus
 *  the newly-selected tenant's identity. */
export interface SelectTenantResponseDto {
  id: number;
  name: string;
  roleName: string;
  token: string;
  email?: string;
  refreshToken?: string;
  tenantId: number;
  tenantName: string;
  tenantCode: string;
  companyLegalName?: string | null;
  currency?: string | null;
  language?: string | null;
  timezone?: string | null;
  logoUrl?: string | null;
}

/** POST /api/platform/tenants/{id}/Members (platform-admin "Grant Access" action). */
export interface LinkExistingUserToTenantDto {
  email: string;
  role: string;
}
