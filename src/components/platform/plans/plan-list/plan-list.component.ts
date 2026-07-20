import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { SubscriptionPlanDto } from '../../../../models/platform/subscription-plan.model';

@Component({
  selector: 'app-plan-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressBarModule,
    TranslateModule,
    HasPermissionDirective,
  ],
  templateUrl: './plan-list.component.html',
  styleUrl: './plan-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  loading = signal(true);
  plans = signal<SubscriptionPlanDto[]>([]);

  constructor() {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.loading.set(true);
    this.platformService.getPlans().subscribe({
      next: (plans) => {
        this.plans.set([...plans].sort((a, b) => a.sortOrder - b.sortOrder));
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  getLimit(plan: SubscriptionPlanDto, metricKey: string): string {
    const limit = plan.limits.find(l => l.metricKey === metricKey);
    if (!limit) return '—';
    return limit.maxValue === null ? '∞' : String(limit.maxValue);
  }

  enabledFeatureCount(plan: SubscriptionPlanDto): number {
    return plan.features.filter(f => f.isEnabled).length;
  }

  newPlan(): void {
    this.router.navigate(['/platform/plans/new']);
  }

  viewPlan(plan: SubscriptionPlanDto): void {
    this.router.navigate(['/platform/plans', plan.id]);
  }

  editPlan(plan: SubscriptionPlanDto): void {
    this.router.navigate(['/platform/plans', plan.id]);
  }

  duplicatePlan(plan: SubscriptionPlanDto): void {
    const newCode = `${plan.code}_COPY_${Date.now()}`;
    const newName = `${plan.name} (Copy)`;
    this.platformService.duplicatePlan(plan, newCode, newName).subscribe({
      next: () => {
        this.notificationService.showSuccess('TOAST.ADD_SUCCESS');
        this.loadPlans();
      },
      error: () => this.notificationService.showError('TOAST.SAVE_ERROR'),
    });
  }

  deactivatePlan(plan: SubscriptionPlanDto): void {
    this.platformService.deactivatePlan(plan.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('TOAST.EDIT_SUCCESS');
        this.loadPlans();
      },
      error: () => this.notificationService.showError('TOAST.SAVE_ERROR'),
    });
  }
}
