import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { AuthService } from '../../../../services/AuthService.service';
import { TenantStatus } from '../../../../models/enums/platform.enums';

@Component({
  selector: 'app-tenant-activation',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, TranslateModule],
  templateUrl: './tenant-activation.component.html',
  styleUrl: './tenant-activation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantActivationComponent {
  private platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(true);
  reasonKey = signal('ONBOARDING.TENANT_ACTIVATION.GENERIC');

  constructor() {
    this.platformService.getMySubscriptionStatus().subscribe({
      next: (status) => {
        if (!status.userIsActive) {
          this.reasonKey.set('ONBOARDING.TENANT_ACTIVATION.USER_INACTIVE');
        } else if (status.tenantStatus === TenantStatus.Provisioning) {
          this.reasonKey.set('ONBOARDING.TENANT_ACTIVATION.PROVISIONING');
        } else if (status.tenantStatus === TenantStatus.Suspended) {
          this.reasonKey.set('ONBOARDING.TENANT_ACTIVATION.SUSPENDED');
        } else if (status.tenantStatus === TenantStatus.Blocked) {
          this.reasonKey.set('ONBOARDING.TENANT_ACTIVATION.BLOCKED');
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
