import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankVehicleDelivery } from '../../../../models/bank-financing/bank-vehicle-delivery.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-bank-vehicle-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MobileCardListComponent
  ],
  providers: [DatePipe],
  templateUrl: './bank-vehicle-delivery-list.component.html',
  styleUrls: ['./bank-vehicle-delivery-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankVehicleDeliveryListComponent implements OnInit {
  private bankFinancingService = inject(BankFinancingService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

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

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: BankVehicleDelivery) => item.deliveryNumber;
  mobileTrackBy = (_index: number, item: BankVehicleDelivery) => item.id;

  mobileFields: MobileCardField<BankVehicleDelivery>[] = [
    { label: 'BANK_FINANCING.ORDER_NUMBER', value: (item) => item.quotationNumber },
    { label: 'BANK_FINANCING.END_USER_NAME', value: (item) => item.endUserName },
    { label: 'BANK_FINANCING.BANK', value: (item) => item.bankName },
    { label: 'VIN', value: (item) => item.vin },
    { label: 'CORPORATE.DELIVERY_DATE', value: (item) => item.deliveryDate ? this.datePipe.transform(item.deliveryDate, 'yyyy-MM-dd') : '' },
    { label: 'CORPORATE.RECEIVER_NAME', value: (item) => item.receiverName },
  ];

  mobileView(item: BankVehicleDelivery): void {
    this.onView({ row: { data: item } });
  }
}
