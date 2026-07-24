import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { TenantContextService } from '../../../../services/tenant-context.service';
import { NotificationService } from '../../../../services/notification.service';
import { resolveOnboardingDestination } from '../../../../models/platform/onboarding-routing.util';
import { TenantMembershipDto } from '../../../../models/platform/tenant-membership.model';

@Component({
  selector: 'app-company-selection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, TranslateModule],
  templateUrl: './company-selection.component.html',
  styleUrl: './company-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanySelectionComponent {
  private platformService = inject(PlatformService);
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  selectingTenantId = signal<number | null>(null);
  memberships = signal<TenantMembershipDto[]>([]);

  constructor() {
    this.tenantContext.loadMemberships().subscribe({
      next: (memberships) => {
        this.memberships.set(memberships);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.COMPANY_SELECTION.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  select(membership: TenantMembershipDto): void {
    this.selectingTenantId.set(membership.tenantId);
    // Re-runs the same status-lookup -> resolveOnboardingDestination() sequence LoginComponent
    // uses for the single-company path, so post-pick routing can't diverge from it.
    this.tenantContext.selectTenant(membership.tenantId).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.platformService.getMySubscriptionStatus().subscribe({
          next: (status) => {
            const destination = resolveOnboardingDestination(status, returnUrl);
            this.router.navigate(destination.commands, { queryParams: destination.queryParams });
          },
          error: () => this.router.navigateByUrl(returnUrl || '/dashboard'),
        });
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.COMPANY_SELECTION.SELECT_ERROR');
        this.selectingTenantId.set(null);
      },
    });
  }
}
