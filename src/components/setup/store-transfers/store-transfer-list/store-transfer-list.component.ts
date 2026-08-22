import { ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxDataGridComponent, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreTransferService } from '../../../../services/store-transfer.service';
import { NotificationService } from '../../../../services/notification.service';
import { StoreTransfer } from '../../../../models/store-transfer.model';

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
    DxDataGridModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './store-transfer-list.component.html',
  styleUrls: ['./store-transfer-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreTransferListComponent implements OnInit {
  @ViewChild(DxDataGridComponent, { static: false }) grid!: DxDataGridComponent;

  private transferService = inject(StoreTransferService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  transfers = signal<StoreTransfer[]>([]);
  loading = signal(false);

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
