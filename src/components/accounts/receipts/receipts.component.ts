import { ChangeDetectionStrategy, Component, computed, Inject, inject, signal, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { ReceiptService } from '../../../services/receipt.service';
import { Receipt } from '../../../models/receipt.model';
import CustomStore from 'devextreme/data/custom_store';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    MobileCardListComponent,
  ],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent implements OnInit {
  private receiptService = inject(ReceiptService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);
  isMobile = this.responsiveService.isMobile;

  // Mirrors the same rows the grid's CustomStore loads, kept as a plain signal so the mobile
  // card list (which needs a concrete array, not a DevExtreme data source) can render/refresh
  // independently -- see payments.component.ts for the identical pattern.
  mobileReceipts = signal<Receipt[]>([]);

  dataSource = new CustomStore({
    key: 'id',
    load: (loadOptions) => {
      return firstValueFrom(this.receiptService.getReceipts()).then(data => {
        this.mobileReceipts.set(data);
        return data;
      });
    }
  });
  toastService = inject(NotificationService);

  constructor() {
    console.log('ReceiptsComponent initialized');
  }

  ngOnInit(): void {
    // Populates mobileReceipts regardless of which view (grid vs. card list) actually renders --
    // on mobile the dx-data-grid never mounts, so its [dataSource] binding alone wouldn't trigger this load.
    this.dataSource.load();
  }

  editReceipt = (e: any) => {
    const receiptId = e.row.data.id;
    if (receiptId) {
      this.router.navigate(['/accounts/receipts/edit', receiptId]);
    } else {
      console.error('Receipt ID not found:', e.row.data);
    }
  }

  deleteReceipt = (e: any) => {
    const receipt = e.row.data;
    if (confirm(this.translate.instant('ACCOUNTS.RECEIPTS.CONFIRM_DELETE') || 'Are you sure you want to delete this receipt?')) {
      this.receiptService.deleteReceipt(receipt.id).subscribe({
        next: () => {
          // Refresh the grid data
          this.dataSource.load();
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.RECEIPTS.DELETED') || 'Receipt deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting receipt:', error);
          alert(this.translate.instant('ACCOUNTS.RECEIPTS.ERROR_DELETING') || 'Error deleting receipt');
        }
      });
    }
  }
  

  trackByReceiptId(index: number, receipt: Receipt): number {
    return receipt.id;
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: Receipt) => item.voucherNumber;
  mobileTrackBy = (_index: number, item: Receipt) => item.id;

  // Values below mirror the desktop grid's actual dxi-column dataFields ("date", "amount"), which
  // don't match the Receipt model's typed fields (voucherDate/totalAmount) -- kept as loosely-typed
  // reads so the mobile cards show the same data the desktop grid does today.
  mobileFields: MobileCardField<Receipt>[] = [
    { label: 'ACCOUNTS.RECEIPTS.COL_DATE', value: (item) => { const d = (item as any).date ?? item.voucherDate; return d ? this.datePipe.transform(d, 'yyyy-MM-dd') : ''; } },
    { label: 'ACCOUNTS.RECEIPTS.COL_CUSTOMER', value: (item) => item.customerName },
    { label: 'ACCOUNTS.RECEIPTS.COL_INVOICE', value: (item) => (item as any).salesInvoiceNumber },
    { label: 'ACCOUNTS.RECEIPTS.COL_AMOUNT', value: (item) => this.currencyPipe.transform((item as any).amount ?? item.totalAmount, 'SAR') },
  ];

  mobileEdit(item: Receipt): void {
    if (item.id) {
      this.router.navigate(['/accounts/receipts/edit', item.id]);
    }
  }

  mobileDelete(item: Receipt): void {
    this.deleteReceipt({ row: { data: item } });
  }
}