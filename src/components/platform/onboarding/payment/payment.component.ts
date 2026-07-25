import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { TapPaymentService } from '../../../../services/tap-payment.service';
import { NotificationService } from '../../../../services/notification.service';
import { AuthService } from '../../../../services/AuthService.service';
import { LanguageService } from '../../../../services/language.service';
import { SubscriptionPlanDto } from '../../../../models/platform/subscription-plan.model';
import { BillingCycle, BillingCycleHelper } from '../../../../models/enums/platform.enums';

const CARD_CONTAINER_ID = 'tap-card-container';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressBarModule, TranslateModule],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformService = inject(PlatformService);
  private tapPaymentService = inject(TapPaymentService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);

  readonly cardContainerId = CARD_CONTAINER_ID;

  loading = signal(true);
  processing = signal(false);
  configError = signal(false);
  plan = signal<SubscriptionPlanDto | null>(null);
  billingCycle!: BillingCycle;

  private planId!: number;
  private cardHandle: { tokenize: () => void; unmount: () => void; result: Promise<{ id: string }> } | null = null;

  ngOnInit(): void {
    const planIdParam = this.route.snapshot.queryParamMap.get('planId');
    const cycleParam = this.route.snapshot.queryParamMap.get('billingCycle');
    if (!planIdParam || !cycleParam) {
      this.router.navigate(['/onboarding/plans']);
      return;
    }
    this.planId = Number(planIdParam);
    this.billingCycle = Number(cycleParam) as BillingCycle;

    this.platformService.getPublicPlans().subscribe({
      next: (plans) => {
        const plan = plans.find(p => p.id === this.planId) ?? null;
        this.plan.set(plan);
        if (!plan) {
          this.router.navigate(['/onboarding/plans']);
          return;
        }
        this.initCardForm(plan);
      },
      error: () => {
        this.configError.set(true);
        this.loading.set(false);
      },
    });
  }

  private initCardForm(plan: SubscriptionPlanDto): void {
    this.platformService.getPublicPaymentConfig().subscribe({
      next: (config) => {
        const user = this.authService.getCurrentUser();
        this.tapPaymentService.mount({
          containerId: this.cardContainerId,
          publicKey: config.tapPublishableKey,
          merchantId: config.tapMerchantId,
          amount: this.priceFor(plan),
          currency: config.currency,
          customerEmail: user?.email || 'customer@example.com',
          customerName: user?.name || 'Customer',
          locale: this.languageService.getCurrentLanguage() === 'ar' ? 'ar' : 'en',
        }).then((handle) => {
          this.cardHandle = handle;
          this.loading.set(false);
        }).catch(() => {
          this.configError.set(true);
          this.loading.set(false);
        });
      },
      error: () => {
        this.configError.set(true);
        this.loading.set(false);
      },
    });
  }

  priceFor(plan: SubscriptionPlanDto): number {
    switch (this.billingCycle) {
      case BillingCycle.Monthly: return plan.priceMonthly;
      case BillingCycle.Quarterly: return plan.priceQuarterly;
      case BillingCycle.SemiAnnual: return plan.priceSemiAnnual;
      case BillingCycle.Yearly: return plan.priceYearly;
      case BillingCycle.Lifetime: return plan.priceLifetime ?? 0;
      default: return 0;
    }
  }

  billingCycleLabel(): string {
    return BillingCycleHelper.getLabel(this.billingCycle);
  }

  pay(): void {
    if (!this.cardHandle || this.processing()) return;
    this.processing.set(true);

    this.cardHandle.result.then(
      (token) => this.completeSubscription(token.id),
      () => this.backToPlanSelection('ONBOARDING.PAYMENT.TOKEN_ERROR'),
    );
    this.cardHandle.tokenize();
  }

  private completeSubscription(tapToken: string): void {
    this.platformService.subscribeCurrentTenant({
      planId: this.planId,
      billingCycle: this.billingCycle,
      startFreeTrial: false,
      tapToken,
    }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
      error: () => this.backToPlanSelection('ONBOARDING.PAYMENT.SUBSCRIBE_ERROR'),
    });
  }

  /** Payment failed or was cancelled -- onboarding stays at "pending subscription" (no
   *  subscription record was created), so send the user back to plan selection rather than
   *  stranding them on a dead card form. */
  private backToPlanSelection(errorKey: string): void {
    this.notificationService.showError(errorKey);
    this.processing.set(false);
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigate(['/onboarding/plans'], { queryParams: returnUrl ? { returnUrl } : undefined });
  }

  ngOnDestroy(): void {
    this.cardHandle?.unmount();
  }
}
