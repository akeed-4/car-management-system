/**
 * Platform/SaaS enums. Numeric values must stay in sync with the backend
 * (CarERP.Core/Enums/PlatformEnums.cs) since they're serialized as plain integers over the wire.
 */
export enum TenantStatus {
  Provisioning = 1,
  Active = 2,
  Suspended = 3,
  Blocked = 4,
}

export enum SubscriptionStatus {
  Trial = 1,
  PendingPayment = 2,
  Active = 3,
  RenewalPending = 4,
  GracePeriod = 5,
  Suspended = 6,
  Expired = 7,
  Cancelled = 8,
  Blocked = 9,
  /** Tenant provisioned, no plan ever chosen yet -- the initial state a self-registered tenant's
   * placeholder subscription is created in. Not a usable status (see resolveOnboardingDestination),
   * so it routes to the plan picker rather than the dashboard. */
  PendingSelection = 10,
}

export enum BillingCycle {
  Monthly = 1,
  Quarterly = 2,
  SemiAnnual = 3,
  Yearly = 4,
  Lifetime = 5,
}

export enum PaymentStatus {
  Pending = 1,
  Success = 2,
  Failed = 3,
  Refunded = 4,
}

export enum PaymentType {
  Initial = 1,
  Renewal = 2,
  Retry = 3,
}

export class TenantStatusHelper {
  static getLabel(status: TenantStatus): string {
    const labels: Record<TenantStatus, string> = {
      [TenantStatus.Provisioning]: 'PLATFORM.TENANT_STATUS.PROVISIONING',
      [TenantStatus.Active]: 'PLATFORM.TENANT_STATUS.ACTIVE',
      [TenantStatus.Suspended]: 'PLATFORM.TENANT_STATUS.SUSPENDED',
      [TenantStatus.Blocked]: 'PLATFORM.TENANT_STATUS.BLOCKED',
    };
    return labels[status];
  }

  static getColor(status: TenantStatus): string {
    const colors: Record<TenantStatus, string> = {
      [TenantStatus.Provisioning]: 'gray',
      [TenantStatus.Active]: 'green',
      [TenantStatus.Suspended]: 'orange',
      [TenantStatus.Blocked]: 'red',
    };
    return colors[status];
  }

  static getAll(): Array<{ value: TenantStatus; label: string }> {
    return Object.values(TenantStatus)
      .filter((v): v is TenantStatus => typeof v === 'number')
      .map(value => ({ value, label: this.getLabel(value) }));
  }
}

export class SubscriptionStatusHelper {
  static getLabel(status: SubscriptionStatus): string {
    const labels: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.Trial]: 'PLATFORM.SUBSCRIPTION_STATUS.TRIAL',
      [SubscriptionStatus.PendingPayment]: 'PLATFORM.SUBSCRIPTION_STATUS.PENDING_PAYMENT',
      [SubscriptionStatus.Active]: 'PLATFORM.SUBSCRIPTION_STATUS.ACTIVE',
      [SubscriptionStatus.RenewalPending]: 'PLATFORM.SUBSCRIPTION_STATUS.RENEWAL_PENDING',
      [SubscriptionStatus.GracePeriod]: 'PLATFORM.SUBSCRIPTION_STATUS.GRACE_PERIOD',
      [SubscriptionStatus.Suspended]: 'PLATFORM.SUBSCRIPTION_STATUS.SUSPENDED',
      [SubscriptionStatus.Expired]: 'PLATFORM.SUBSCRIPTION_STATUS.EXPIRED',
      [SubscriptionStatus.Cancelled]: 'PLATFORM.SUBSCRIPTION_STATUS.CANCELLED',
      [SubscriptionStatus.Blocked]: 'PLATFORM.SUBSCRIPTION_STATUS.BLOCKED',
      [SubscriptionStatus.PendingSelection]: 'PLATFORM.SUBSCRIPTION_STATUS.PENDING_SELECTION',
    };
    return labels[status];
  }

  static getColor(status: SubscriptionStatus): string {
    const colors: Record<SubscriptionStatus, string> = {
      [SubscriptionStatus.Trial]: 'blue',
      [SubscriptionStatus.PendingPayment]: 'gray',
      [SubscriptionStatus.Active]: 'green',
      [SubscriptionStatus.RenewalPending]: 'orange',
      [SubscriptionStatus.GracePeriod]: 'orange',
      [SubscriptionStatus.Suspended]: 'red',
      [SubscriptionStatus.Expired]: 'red',
      [SubscriptionStatus.Cancelled]: 'gray',
      [SubscriptionStatus.Blocked]: 'red',
      [SubscriptionStatus.PendingSelection]: 'gray',
    };
    return colors[status];
  }

  static getAll(): Array<{ value: SubscriptionStatus; label: string }> {
    return Object.values(SubscriptionStatus)
      .filter((v): v is SubscriptionStatus => typeof v === 'number')
      .map(value => ({ value, label: this.getLabel(value) }));
  }
}

export class BillingCycleHelper {
  static getLabel(cycle: BillingCycle): string {
    const labels: Record<BillingCycle, string> = {
      [BillingCycle.Monthly]: 'PLATFORM.BILLING_CYCLE.MONTHLY',
      [BillingCycle.Quarterly]: 'PLATFORM.BILLING_CYCLE.QUARTERLY',
      [BillingCycle.SemiAnnual]: 'PLATFORM.BILLING_CYCLE.SEMI_ANNUAL',
      [BillingCycle.Yearly]: 'PLATFORM.BILLING_CYCLE.YEARLY',
      [BillingCycle.Lifetime]: 'PLATFORM.BILLING_CYCLE.LIFETIME',
    };
    return labels[cycle];
  }

  static getAll(): Array<{ value: BillingCycle; label: string }> {
    return Object.values(BillingCycle)
      .filter((v): v is BillingCycle => typeof v === 'number')
      .map(value => ({ value, label: this.getLabel(value) }));
  }
}

export class PaymentStatusHelper {
  static getLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      [PaymentStatus.Pending]: 'PLATFORM.PAYMENT_STATUS.PENDING',
      [PaymentStatus.Success]: 'PLATFORM.PAYMENT_STATUS.SUCCESS',
      [PaymentStatus.Failed]: 'PLATFORM.PAYMENT_STATUS.FAILED',
      [PaymentStatus.Refunded]: 'PLATFORM.PAYMENT_STATUS.REFUNDED',
    };
    return labels[status];
  }

  static getColor(status: PaymentStatus): string {
    const colors: Record<PaymentStatus, string> = {
      [PaymentStatus.Pending]: 'gray',
      [PaymentStatus.Success]: 'green',
      [PaymentStatus.Failed]: 'red',
      [PaymentStatus.Refunded]: 'orange',
    };
    return colors[status];
  }
}

export class PaymentTypeHelper {
  static getLabel(type: PaymentType): string {
    const labels: Record<PaymentType, string> = {
      [PaymentType.Initial]: 'PLATFORM.PAYMENT_TYPE.INITIAL',
      [PaymentType.Renewal]: 'PLATFORM.PAYMENT_TYPE.RENEWAL',
      [PaymentType.Retry]: 'PLATFORM.PAYMENT_TYPE.RETRY',
    };
    return labels[type];
  }
}
