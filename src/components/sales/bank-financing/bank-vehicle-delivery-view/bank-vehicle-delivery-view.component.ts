import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankVehicleDelivery } from '../../../../models/bank-financing/bank-vehicle-delivery.model';
import { ChecklistItem } from '../../shared/document-checklist/document-checklist.component';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

@Component({
  selector: 'app-bank-vehicle-delivery-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatGridListModule,
    TranslateModule,
    AttachmentUploaderComponent
  ],
  templateUrl: './bank-vehicle-delivery-view.component.html',
  styleUrls: ['./bank-vehicle-delivery-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVehicleDeliveryViewComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  delivery = signal<BankVehicleDelivery | null>(null);
  loading = signal(false);

  checklist = computed<ChecklistItem[]>(() => {
    const json = this.delivery()?.checklistJson;
    if (!json) {
      return [];
    }
    try {
      return JSON.parse(json) as ChecklistItem[];
    } catch {
      return [];
    }
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDelivery(id);
    }
  }

  private loadDelivery(id: number): void {
    this.loading.set(true);
    this.bankFinancingService.getVehicleDeliveryById(id).subscribe({
      next: delivery => {
        this.delivery.set(delivery);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.DELIVERY_LOAD_FAILED');
      }
    });
  }
}
