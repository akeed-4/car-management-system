import { BillingCycle, SubscriptionStatus, TenantStatus } from '../enums/platform.enums';

/** Payload for public, unauthenticated tenant self-registration (POST /api/platform/public/tenants/Register).
 *  Distinct from CreateTenantDto (tenant.model.ts), which is the platform-admin console's DTO for
 *  creating tenants on a customer's behalf and includes admin-only fields (planId, isActive, notes). */
export interface SelfRegisterTenantDto {
  companyName: string;
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  country?: string | null;
}

/** GET /api/platform/my/subscription/Status -- the calling tenant's own account/subscription state.
 *  `hasActiveSubscription` is true for Trial/Active/RenewalPending/GracePeriod (i.e. "still usable"),
 *  false otherwise -- the guard/UI should not have to re-derive that from `status` itself.
 *  `status` is absent when the tenant has never subscribed to anything yet (brand new signup). */
export interface MySubscriptionStatusDto {
  hasActiveSubscription: boolean;
  status?: SubscriptionStatus | null;
  tenantId: number;
  tenantStatus: TenantStatus;
  userIsActive: boolean;
  planId?: number | null;
  planName?: string | null;
  billingCycle?: BillingCycle | null;
  trialEndsAt?: string | null;
}

/** POST /api/platform/my/subscription/Subscribe. Exactly one of `startFreeTrial` / `tapToken`
 *  is meaningful: a free trial needs no payment token, a paid subscription needs a Tap Card SDK
 *  token (tokenized client-side -- see TapPaymentService) instead of raw card data. */
export interface SubscribeToPlanDto {
  planId: number;
  billingCycle: BillingCycle;
  startFreeTrial: boolean;
  tapToken?: string | null;
}

/** GET /api/platform/public/payment-config/Get -- only the Tap *publishable* key ever crosses this
 *  boundary. The secret key (GlobalSettingsFormValue.tapSecretKey) stays server-side. */
export interface PublicPaymentConfigDto {
  tapPublishableKey: string;
  tapMerchantId: string;
  currency: string;
}
