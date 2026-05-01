import { ChangeDetectionStrategy, Component, computed, Inject, inject, signal } from '@angular/core';
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
import { ReceiptVoucher } from '../../../models/receipt-voucher.model';
import CustomStore from 'devextreme/data/custom_store';
import { ToastService } from '@/src/services/toast.service';
import { NotificationService } from '@/src/services/notification.service';

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
  ],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent {
  private receiptService = inject(ReceiptService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  
  dataSource = new CustomStore({
    key: 'id',
    load: (loadOptions) => {
      return this.receiptService.getReceipts().toPromise();
    }
  });
  toastService = inject(NotificationService);

  constructor() {
    console.log('ReceiptsComponent initialized');
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
          // Refresh the grid
          this.dataSource;
          this.toastService.showSuccess(this.translate.instant('ACCOUNTS.RECEIPTS.DELETED') || 'Receipt deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting receipt:', error);
          alert(this.translate.instant('ACCOUNTS.RECEIPTS.ERROR_DELETING') || 'Error deleting receipt');
        }
      });
    }
  }
  

  trackByReceiptId(index: number, receipt: ReceiptVoucher): number {
    return receipt.id;
  }
}