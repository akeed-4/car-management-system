import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { SubscriptionDto } from '../../../../models/platform/subscription.model';
import {
  BillingCycleHelper,
  PaymentStatusHelper,
  SubscriptionStatus,
  SubscriptionStatusHelper,
} from '../../../../models/enums/platform.enums';

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    DxDataGridModule,
    TranslateModule,
    HasPermissionDirective,
  ],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);

  loading = signal(true);
  subscriptions = signal<SubscriptionDto[]>([]);

  readonly SubscriptionStatus = SubscriptionStatus;
  readonly getStatusLabel = SubscriptionStatusHelper.getLabel;
  readonly getStatusColor = SubscriptionStatusHelper.getColor;
  readonly getCycleLabel = BillingCycleHelper.getLabel;
  readonly getPaymentStatusLabel = PaymentStatusHelper.getLabel;
  readonly getPaymentStatusColor = PaymentStatusHelper.getColor;

  constructor() {
    this.loadSubscriptions();
  }

  private loadSubscriptions(): void {
    this.loading.set(true);
    this.platformService.getSubscriptions().subscribe({
      next: (subs) => {
        this.subscriptions.set(subs);
        this.loading.set(false);
      },
      error: () => {
        this.notificationService.showError('TOAST.LOAD_ERROR');
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.loadSubscriptions();
  }

  renew(subscription: SubscriptionDto): void {
    this.platformService.renewSubscription(subscription.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('TOAST.EDIT_SUCCESS');
        this.refresh();
      },
      error: () => this.notificationService.showError('TOAST.SAVE_ERROR'),
    });
  }

  cancel(subscription: SubscriptionDto): void {
    this.platformService.cancelSubscription(subscription.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('TOAST.EDIT_SUCCESS');
        this.refresh();
      },
      error: () => this.notificationService.showError('TOAST.SAVE_ERROR'),
    });
  }
}
