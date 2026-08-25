import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { BankFinancingService } from '../../../../services/bank-financing.service';
import { NotificationService } from '@/src/services/notification.service';
import { BankVehicleDelivery } from '../../../../models/bank-financing/bank-vehicle-delivery.model';
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-bank-vehicle-delivery-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule
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

  deliveries = signal<BankVehicleDelivery[]>([]);
  loading = signal(false);

  /** Config-driven columns -- same fields/captions as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'deliveryNumber', dataType: 'string', caption: 'BANK_FINANCING.DELIVERY_NUMBER' },
    { dataField: 'quotationNumber', dataType: 'string', caption: 'BANK_FINANCING.ORDER_NUMBER' },
    { dataField: 'endUserName', dataType: 'string', caption: 'BANK_FINANCING.END_USER_NAME' },
    { dataField: 'bankName', dataType: 'string', caption: 'BANK_FINANCING.BANK' },
    { dataField: 'vin', dataType: 'string', caption: 'VIN' },
    { dataField: 'deliveryDate', dataType: 'date', caption: 'CORPORATE.DELIVERY_DATE' },
    { dataField: 'receiverName', dataType: 'string', caption: 'CORPORATE.RECEIVER_NAME' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 80, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView({ row: { data: e.row } });
  }

  /** Row double-click opens the record -- same behavior, adapted to the shared output. */
  onGridRowDblClick(row: any): void {
    this.onView({ row: { data: row } });
  }

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
