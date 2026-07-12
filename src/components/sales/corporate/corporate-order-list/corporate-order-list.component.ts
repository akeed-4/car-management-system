import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CorporateFleetService } from '../../../../services/corporate-fleet.service';
import { NotificationService } from '@/src/services/notification.service';
import { CorporateOrder } from '../../../../models/corporate/corporate-order.model';

@Component({
  selector: 'app-corporate-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './corporate-order-list.component.html',
  styleUrls: ['./corporate-order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorporateOrderListComponent implements OnInit {
  private corporateFleetService = inject(CorporateFleetService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  orders = signal<CorporateOrder[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.corporateFleetService.getOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('CORPORATE.ORDERS_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/corporate/orders/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/corporate/orders/view', id]);
  };
}
