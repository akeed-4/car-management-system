import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { RetailService } from '../../../../services/retail.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { RetailDelivery } from '../../../../models/retail/retail-delivery.model';
import { ChecklistItem } from '../../shared/document-checklist/document-checklist.component';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

/** Shared view for Retail (Afrad) and Bank Financing (Bunuk) vehicle delivery documents. */
@Component({
  selector: 'app-retail-delivery-view',
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
  templateUrl: './retail-delivery-view.component.html',
  styleUrls: ['./retail-delivery-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetailDeliveryViewComponent implements OnInit {
  private retailService = inject(RetailService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  isBankChannel = false;
  deliveryNote = signal<RetailDelivery | null>(null);
  loading = signal(false);

  checklist = computed<ChecklistItem[]>(() => {
    const json = this.deliveryNote()?.checklistJson;
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
    this.isBankChannel = this.route.snapshot.data['channel'] === 'bank';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDeliveryNote(id);
    }
  }

  private loadDeliveryNote(id: number): void {
    this.loading.set(true);
    this.retailService.getDeliveryById(id).subscribe({
      next: note => {
        this.deliveryNote.set(note);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.DELIVERY_LOAD_FAILED');
      }
    });
  }
}
