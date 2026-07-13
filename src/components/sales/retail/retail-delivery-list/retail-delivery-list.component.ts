import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RetailService } from '../../../../services/retail.service';
import { NotificationService } from '@/src/services/notification.service';
import { RetailDelivery } from '../../../../models/retail/retail-delivery.model';
import { HasPermissionDirective } from '../../../shared/permission.directive';

const SALES_CHANNEL_BUNUK = 3;

/**
 * Shared delivery-note list for both Retail (Afrad) and Bank Financing (Bunuk)
 * vehicle delivery, since both create DeliveryNote rows through the same
 * RetailSalesController/DeliveryNote entity. The channel is inferred from the
 * route data (see app.routes.ts) so the same component serves both menu items
 * without duplicating a nearly-identical screen.
 */
@Component({
  selector: 'app-retail-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    HasPermissionDirective
  ],
  templateUrl: './retail-delivery-list.component.html',
  styleUrls: ['./retail-delivery-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetailDeliveryListComponent implements OnInit {
  private retailService = inject(RetailService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isBankChannel = false;
  deliveryNotes = signal<RetailDelivery[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.isBankChannel = this.route.snapshot.data['channel'] === 'bank';
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.loading.set(true);
    this.retailService.getDeliveries(this.isBankChannel ? SALES_CHANNEL_BUNUK : undefined).subscribe({
      next: notes => {
        this.deliveryNotes.set(notes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('RETAIL.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/deliveries/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    const base = this.isBankChannel ? '/sales/bank/deliveries/view' : '/sales/retail/deliveries/view';
    this.router.navigate([base, id]);
  };
}
