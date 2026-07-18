import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankQuotation } from '../../../../models/bank-financing/bank-quotation.model';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-bank-order-list',
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
  templateUrl: './bank-order-list.component.html',
  styleUrls: ['./bank-order-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankOrderListComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  orders = signal<BankQuotation[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.bankFinancingService.getAllOrders().subscribe({
      next: orders => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.ORDERS_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/orders/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/bank/orders/view', id]);
  };
}
