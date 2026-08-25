import { ChangeDetectionStrategy, Component, inject, signal, viewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { PlatformService } from '../../../../services/platform.service';
import { NotificationService } from '../../../../services/notification.service';
import { PermissionService } from '../../../../services/permission.service';
import { SubscriptionDto } from '../../../../models/platform/subscription.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
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
    SharedDataGridComponent,
    TranslateModule,
  ],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionListComponent {
  private platformService = inject(PlatformService);
  private notificationService = inject(NotificationService);
  private permissionService = inject(PermissionService);

  loading = signal(true);
  subscriptions = signal<SubscriptionDto[]>([]);

  readonly SubscriptionStatus = SubscriptionStatus;
  readonly getStatusLabel = SubscriptionStatusHelper.getLabel;
  readonly getStatusColor = SubscriptionStatusHelper.getColor;
  readonly getCycleLabel = BillingCycleHelper.getLabel;
  readonly getPaymentStatusLabel = PaymentStatusHelper.getLabel;
  readonly getPaymentStatusColor = PaymentStatusHelper.getColor;

  /** Screen-specific badge renderers passed generically to the Shared DataGrid. */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');
  private paymentStatusTpl = viewChild<TemplateRef<any>>('paymentStatusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    const paymentStatus = this.paymentStatusTpl();
    return {
      ...(status ? { statusTemplate: status } : {}),
      ...(paymentStatus ? { paymentStatusTemplate: paymentStatus } : {}),
    };
  }

  /** Config-driven columns -- same fields/formats as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'tenantName', dataType: 'string', caption: 'PLATFORM.SUBSCRIPTIONS.TENANT' },
    { dataField: 'planName', dataType: 'string', caption: 'PLATFORM.SUBSCRIPTIONS.PLAN' },
    { dataField: 'status', dataType: 'string', caption: 'PLATFORM.SUBSCRIPTIONS.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'currentPeriodStart', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PLATFORM.SUBSCRIPTIONS.START' },
    { dataField: 'currentPeriodEnd', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PLATFORM.SUBSCRIPTIONS.END' },
    { dataField: 'nextRenewalAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'PLATFORM.SUBSCRIPTIONS.RENEW' },
    { dataField: 'amount', dataType: 'number', format: '#,##0.00', caption: 'PLATFORM.SUBSCRIPTIONS.AMOUNT' },
    { dataField: 'paymentStatus', dataType: 'string', caption: 'PLATFORM.SUBSCRIPTIONS.PAYMENT_STATUS', cellTemplate: 'paymentStatusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: 'COMMON.ACTIONS', width: 120, allowSorting: false, allowFiltering: false },
  ];

  /** Permission-gated actions -- same platform.subscriptions.manage rule. */
  rowActions: sharedGridRowActionDto[] = [
    {
      id: 'renew', icon: 'autorenew', labelKey: 'PLATFORM.SUBSCRIPTIONS.RENEW',
      visible: () => this.permissionService.hasPermission('platform.subscriptions.manage'),
    },
    {
      id: 'cancel', icon: 'cancel', labelKey: 'PLATFORM.SUBSCRIPTIONS.CANCEL', cssClass: 'warn',
      visible: () => this.permissionService.hasPermission('platform.subscriptions.manage'),
    },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const subscription = e.row as SubscriptionDto;
    if (e.actionId === 'renew') this.renew(subscription);
    else if (e.actionId === 'cancel') this.cancel(subscription);
  }

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
