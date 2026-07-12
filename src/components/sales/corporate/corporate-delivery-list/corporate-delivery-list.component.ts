import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { DeliveryNoteResult } from '../../../../models/corporate/corporate-dispatch.model';

@Component({
  selector: 'app-corporate-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './corporate-delivery-list.component.html',
  styleUrls: ['./corporate-delivery-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateDeliveryListComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  deliveryNotes = signal<DeliveryNoteResult[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadDeliveryNotes();
  }

  loadDeliveryNotes(): void {
    this.loading.set(true);
    this.corporateFleetService.getDeliveryNotes().subscribe({
      next: notes => {
        this.deliveryNotes.set(notes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/deliveries/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/corporate/deliveries/view', id]);
  };
}
