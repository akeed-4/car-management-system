import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { SubscriptionPlanDto } from '../../../../models/platform/subscription-plan.model';
import { BillingCycle, BillingCycleHelper } from '../../../../models/enums/platform.enums';

/** Plan.code -> i18n key. Plan names/codes come from the backend catalog (see PlanCodes.cs) as
 *  fixed English identifiers, not translated strings -- this is the one place that maps them to
 *  display labels so ONBOARDING.PLANS.NAMES.* stays in sync across languages. */
const PLAN_NAME_KEYS: Record<string, string> = {
  Starter: 'ONBOARDING.PLANS.NAMES.STARTER',
  Professional: 'ONBOARDING.PLANS.NAMES.PROFESSIONAL',
  Enterprise: 'ONBOARDING.PLANS.NAMES.ENTERPRISE',
  Unlimited: 'ONBOARDING.PLANS.NAMES.UNLIMITED',
};

/** PlanFeatureDto.featureKey -> i18n key -- mirrors PLAN_FEATURE_KEYS in subscription-plan.model.ts. */
const FEATURE_LABEL_KEYS: Record<string, string> = {
  Accounting: 'ONBOARDING.PLANS.FEATURES.ACCOUNTING',
  Inventory: 'ONBOARDING.PLANS.FEATURES.INVENTORY',
  Sales: 'ONBOARDING.PLANS.FEATURES.SALES',
  Purchases: 'ONBOARDING.PLANS.FEATURES.PURCHASES',
  POS: 'ONBOARDING.PLANS.FEATURES.POS',
  CRM: 'ONBOARDING.PLANS.FEATURES.CRM',
  Reports: 'ONBOARDING.PLANS.FEATURES.REPORTS',
  Notifications: 'ONBOARDING.PLANS.FEATURES.NOTIFICATIONS',
};

/** Feature keys that must never be shown in the Plan Selection UI, even if an older/unmigrated
 *  backend still returns a PlanFeature row for them (e.g. a not-yet-cleaned-up database). These
 *  modules are not offered in any subscription plan. */
const HIDDEN_FEATURE_KEYS = new Set(['Payroll', 'HR', 'Assets', 'Manufacturing', 'AI', 'MobileApp', 'Api']);

@Component({
  selector: 'app-plan-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './plan-selection.component.html',
  styleUrl: './plan-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanSelectionComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  loadError = signal(false);
  subscribingPlanId = signal<number | null>(null);
  plans = signal<SubscriptionPlanDto[]>([]);
  billingCycle = signal<BillingCycle>(BillingCycle.Monthly);

  readonly billingCycles = BillingCycleHelper.getAll();

  /** True while a getPublicPlans() request is already in flight -- guards loadPlans() (and
   *  therefore the retry button) against firing a second overlapping request, and against
   *  applying a stale response's plans/loading state after this component has been destroyed
   *  (e.g. the user double-navigated away and back before the first request settled). */
  private loadInProgress = false;

  constructor() {
    this.loadPlans();
  }

  /** Lets the user recover from a failed fetch (e.g. a transient network error right after a
   *  fresh tenant provisioning) without a manual page refresh -- exposed as a "Retry" action in
   *  the template's error state. */
  retry(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    if (this.loadInProgress) {
      return;
    }
    this.loadInProgress = true;
    this.loading.set(true);
    this.loadError.set(false);
    this.platformService.getPublicPlans().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (plans) => {
        const visiblePlans = plans
          .filter(p => p.isActive)
          .map(p => ({ ...p, features: p.features.filter(f => !HIDDEN_FEATURE_KEYS.has(f.featureKey)) }))
          .sort((a, b) => a.sortOrder - b.sortOrder);
        this.plans.set(visiblePlans);
        this.loading.set(false);
        this.loadInProgress = false;
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.PLANS.LOAD_ERROR');
        this.loadError.set(true);
        this.loading.set(false);
        this.loadInProgress = false;
      },
    });
  }

  setBillingCycle(cycle: BillingCycle): void {
    this.billingCycle.set(cycle);
  }

  priceFor(plan: SubscriptionPlanDto): number | null {
    switch (this.billingCycle()) {
      case BillingCycle.Monthly: return plan.priceMonthly;
      case BillingCycle.Quarterly: return plan.priceQuarterly;
      case BillingCycle.SemiAnnual: return plan.priceSemiAnnual;
      case BillingCycle.Yearly: return plan.priceYearly;
      case BillingCycle.Lifetime: return plan.priceLifetime ?? null;
      default: return null;
    }
  }

  billingCycleLabel(): string {
    return this.billingCycles.find(c => c.value === this.billingCycle())?.label ?? '';
  }

  planNameKey(plan: SubscriptionPlanDto): string {
    return PLAN_NAME_KEYS[plan.code] ?? plan.name;
  }

  featureLabelKey(featureKey: string): string {
    return FEATURE_LABEL_KEYS[featureKey] ?? featureKey;
  }

  private returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }

  startFreeTrial(plan: SubscriptionPlanDto): void {
    this.subscribingPlanId.set(plan.id);
    this.platformService.subscribeCurrentTenant({
      planId: plan.id,
      billingCycle: this.billingCycle(),
      startFreeTrial: true,
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess('ONBOARDING.PLANS.TRIAL_STARTED');
        this.router.navigateByUrl(this.returnUrl() || '/dashboard');
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.PLANS.SUBSCRIBE_ERROR');
        this.subscribingPlanId.set(null);
      },
    });
  }

  subscribeAndPay(plan: SubscriptionPlanDto): void {
    const returnUrl = this.returnUrl();
    this.router.navigate(['/onboarding/payment'], {
      queryParams: {
        planId: plan.id,
        billingCycle: this.billingCycle(),
        ...(returnUrl ? { returnUrl } : {}),
      },
    });
  }
}
