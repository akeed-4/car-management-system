import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateOrder } from '../../../../models/corporate/corporate-order.model';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

@Component({
  selector: 'app-corporate-order-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    DxDataGridModule,
    TranslateModule,
    AttachmentUploaderComponent
  ],
  templateUrl: './corporate-order-view.component.html',
  styleUrls: ['./corporate-order-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateOrderViewComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  order = signal<CorporateOrder | null>(null);
  loading = signal(false);

  statusClass = computed(() => {
    const status = this.order()?.status;
    switch (status) {
      case 'New':
        return 'status-draft';
      case 'DepositPaid':
      case 'Processing':
        return 'status-pending';
      case 'Completed':
        return 'status-accepted';
      default:
        return 'status-draft';
    }
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadOrder(id);
    }
  }

  private loadOrder(id: number): void {
    this.loading.set(true);
    this.corporateFleetService.getOrderById(id).subscribe({
      next: order => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.ORDER_LOAD_FAILED');
      }
    });
  }
}
