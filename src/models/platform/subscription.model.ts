import { BillingCycle, PaymentStatus, PaymentType, SubscriptionStatus } from '../enums/platform.enums';

export interface SubscriptionDto {
  id: number;
  tenantId: number;
  tenantName: string;
  planId: number;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  trialEndsAt?: string | null;
  gracePeriodEndsAt?: string | null;
  cancelledAt?: string | null;
  nextRenewalAt?: string | null;
  autoRenew: boolean;
  amount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface PaymentDto {
  id: number;
  tenantId: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  provider: string;
  type: PaymentType;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string | null;
}
