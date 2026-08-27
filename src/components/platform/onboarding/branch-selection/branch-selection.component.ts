import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { BranchContextService } from '../../../../services/branch-context.service';
import { NotificationService } from '../../../../services/notification.service';
import { BranchMembershipDto } from '../../../../models/platform/branch-membership.model';

/** Mirrors CompanySelectionComponent one level down the hierarchy. Shown once, immediately after
 *  login, only when the caller has 2+ branches to choose from -- branchSelectedGuard sends single-
 *  branch and zero-branch users straight past this screen. */
@Component({
  selector: 'app-branch-selection',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule, MatIconModule, TranslateModule],
  templateUrl: './branch-selection.component.html',
  styleUrl: './branch-selection.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchSelectionComponent {
  private branchContext = inject(BranchContextService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  selectingBranchId = signal<number | null>(null);
  memberships = signal<BranchMembershipDto[]>([]);

  constructor() {
    this.branchContext.loadMemberships().subscribe({
      next: (memberships) => {
        this.memberships.set(memberships);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.BRANCH_SELECTION.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  select(membership: BranchMembershipDto): void {
    this.selectingBranchId.set(membership.branchId);
    this.branchContext.selectBranch(membership.branchId).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || '/dashboard');
      },
      error: () => {
        this.notificationService.showError('ONBOARDING.BRANCH_SELECTION.SELECT_ERROR');
        this.selectingBranchId.set(null);
      },
    });
  }
}
