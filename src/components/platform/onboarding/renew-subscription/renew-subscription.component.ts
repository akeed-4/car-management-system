import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { AuthService } from '../../../../services/AuthService.service';
import { MySubscriptionStatusDto } from '../../../../models/platform/onboarding.model';
import { SubscriptionStatusHelper } from '../../../../models/enums/platform.enums';

@Component({
  selector: 'app-renew-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatProgressBarModule, TranslateModule],
  templateUrl: './renew-subscription.component.html',
  styleUrl: './renew-subscription.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RenewSubscriptionComponent {
  private platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  status = signal<MySubscriptionStatusDto | null>(null);

  constructor() {
    this.platformService.getMySubscriptionStatus().subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusLabel(): string {
    const status = this.status()?.status;
    return status ? SubscriptionStatusHelper.getLabel(status) : '';
  }

  renew(): void {
    const status = this.status();
    if (status?.planId && status?.billingCycle) {
      this.router.navigate(['/onboarding/payment'], {
        queryParams: { planId: status.planId, billingCycle: status.billingCycle },
      });
    } else {
      this.router.navigate(['/onboarding/plans']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
