import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { TenantContextService } from '../../../services/tenant-context.service';
import { NotificationService } from '../../../services/notification.service';
import { TenantMembershipDto } from '../../../models/platform/tenant-membership.model';

/**
 * Always-visible company indicator for the top navbar: shows the current tenant's name + logo.
 * When the user has access to more than one company (TenantContextService.hasMultipleTenants()),
 * it renders as a dropdown trigger so they can switch; otherwise it's a static, non-interactive
 * chip. Memberships are already loaded into TenantContextService by companySelectedGuard before
 * the app shell (and this component) ever renders -- no extra fetch needed here.
 */
@Component({
  selector: 'app-company-switcher',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule, TranslateModule],
  templateUrl: './company-switcher.component.html',
  styleUrl: './company-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanySwitcherComponent {
  private tenantContext = inject(TenantContextService);
  private notificationService = inject(NotificationService);

  switching = signal(false);

  current = this.tenantContext.current;
  memberships = this.tenantContext.memberships;
  hasMultipleTenants = this.tenantContext.hasMultipleTenants;

  switchTo(membership: TenantMembershipDto): void {
    if (membership.tenantId === this.current()?.tenantId || this.switching()) return;

    this.switching.set(true);
    this.tenantContext.selectTenant(membership.tenantId).subscribe({
      next: () => {
        // Full reload, not router.navigate -- switching companies needs every already-loaded
        // widget/permission/menu to refetch under the new tenant, including on the (common) case
        // where the user is already sitting on /dashboard, where a same-URL router navigation
        // wouldn't re-trigger anything. Same UX pattern GitHub/Slack use for org/workspace
        // switching.
        window.location.href = '/dashboard';
      },
      error: () => {
        this.switching.set(false);
        this.notificationService.showError('LAYOUT.COMPANY_SWITCHER.SWITCH_ERROR');
      },
    });
  }
}
