import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { TranslateModule } from '@ngx-translate/core';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { CurrentSettingService } from '../../../../services/current-setting.service';
import { NotificationService } from '@/src/services/notification.service';
import { DeliveryNoteResult } from '../../../../models/corporate/corporate-dispatch.model';
import { ChecklistItem } from '../../shared/document-checklist/document-checklist.component';
import { AttachmentUploaderComponent } from '../../shared/attachment-uploader/attachment-uploader.component';

@Component({
  selector: 'app-corporate-delivery-view',
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
  templateUrl: './corporate-delivery-view.component.html',
  styleUrls: ['./corporate-delivery-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateDeliveryViewComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private currentSettingService = inject(CurrentSettingService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  cardLayout3 = this.currentSettingService.getCardLayout(3);

  deliveryNote = signal<DeliveryNoteResult | null>(null);
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
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadDeliveryNote(id);
    }
  }

  private loadDeliveryNote(id: number): void {
    this.loading.set(true);
    this.corporateFleetService.getDeliveryNoteById(id).subscribe({
      next: (note: any) => {
        this.deliveryNote.set(note.data || note || null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.DELIVERY_LOAD_FAILED');
      }
    });
  }
}
