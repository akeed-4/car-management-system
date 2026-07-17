import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankVehicleDelivery } from '../../../../models/bank-financing/bank-vehicle-delivery.model';

@Component({
  selector: 'app-bank-vehicle-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './bank-vehicle-delivery-list.component.html',
  styleUrls: ['./bank-vehicle-delivery-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVehicleDeliveryListComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  deliveries = signal<BankVehicleDelivery[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadDeliveries();
  }

  loadDeliveries(): void {
    this.loading.set(true);
    this.bankFinancingService.getVehicleDeliveries().subscribe({
      next: deliveries => {
        this.deliveries.set(deliveries || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError('BANK_FINANCING.DELIVERIES_LOAD_FAILED');
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/sales/bank/deliveries/new']);
  }

  onView = (e: any): void => {
    const id = e.row.data.id;
    this.router.navigate(['/sales/bank/deliveries/view', id]);
  };
}
