import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../../shared/shared-data-grid/shared-data-grid.component';
import { StoreTransferService } from '../../../../services/store-transfer.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreTransfer } from '../../../../models/store-transfer.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';

@Component({
  selector: 'app-store-transfer-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    TranslateModule,
    SharedDataGridComponent
  ],
  templateUrl: './store-transfer-list.component.html',
  styleUrls: ['./store-transfer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreTransferListComponent implements OnInit {
  @ViewChild(SharedDataGridComponent, { static: false }) grid!: SharedDataGridComponent;

  private transferService = inject(StoreTransferService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  transfers = signal<StoreTransfer[]>([]);
  loading = signal(false);

  /** Config-driven columns -- tri-state badge via statusClass resolver. */
  columns: dataGridColumnDto[] = [
    { dataField: 'transferNumber', dataType: 'string', caption: 'STORE_TRANSFER.TRANSFER_NUMBER', width: 150 },
    { dataField: 'transferDate', dataType: 'date', caption: 'STORE_TRANSFER.TRANSFER_DATE', width: 130 },
    { dataField: 'fromStoreName', dataType: 'string', caption: 'STORE_TRANSFER.FROM_STORE' },
    { dataField: 'toStoreName', dataType: 'string', caption: 'STORE_TRANSFER.TO_STORE' },
    {
      dataField: 'status',
      dataType: 'string',
      caption: 'COMMON.STATUS',
      width: 120,
      type: 'status',
      allowSorting: false,
      statusClass: (_row, value) =>
        value === 'Approved' ? 'success' : value === 'Pending' ? 'warning' : value === 'Rejected' ? 'danger' : 'neutral',
    },
    { dataField: '__actions', dataType: 'string', caption: 'COMMON.ACTIONS', width: 130, type: 'actions', allowSorting: false, allowFiltering: false },
  ];

  /** Row actions -- approve/reject only for Pending transfers, as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'approve', icon: 'check_circle', labelKey: 'STORE_TRANSFER.APPROVE', visible: (row) => row.status === 'Pending' },
    { id: 'reject', icon: 'cancel', labelKey: 'STORE_TRANSFER.REJECT', cssClass: 'warn', visible: (row) => row.status === 'Pending' },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'approve') this.onApprove(wrapped);
    else if (e.actionId === 'reject') this.onReject(wrapped);
  }


  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading.set(true);
    this.transferService.getAll().subscribe({
      next: (data) => {
        this.transfers.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.showError(this.translate.instant('STORE_TRANSFER.LOAD_ERROR'));
      }
    });
  }

  refresh(): void {
    this.loadTransfers();
  }

  onCreate(): void {
    this.router.navigate(['/setup/store-transfers/new']);
  }

  onApprove = (e: any): void => {
    const transfer: StoreTransfer = e.row.data;
    const message = this.translate.instant('STORE_TRANSFER.CONFIRM_APPROVE', { number: transfer.transferNumber });
    if (!confirm(message)) return;

    this.transferService.approve(transfer.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('STORE_TRANSFER.APPROVE_SUCCESS'));
        this.loadTransfers();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('STORE_TRANSFER.APPROVE_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  onReject = (e: any): void => {
    const transfer: StoreTransfer = e.row.data;
    const message = this.translate.instant('STORE_TRANSFER.CONFIRM_REJECT', { number: transfer.transferNumber });
    if (!confirm(message)) return;

    this.transferService.reject(transfer.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('STORE_TRANSFER.REJECT_SUCCESS'));
        this.loadTransfers();
      },
      error: (err) => {
        const msg = err?.error?.message || err?.error || this.translate.instant('STORE_TRANSFER.REJECT_ERROR');
        this.notificationService.showError(msg);
      }
    });
  };

  printGrid(): void {
    window.print();
  }
}
