import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-purchase-return-invoice',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule, DxButtonModule],
  templateUrl: './purchase-return-invoice.component.html',
  styleUrl: './purchase-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnInvoiceComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  returnInvoices = toSignal(this.purchaseReturnService.getReturnInvoices(), { initialValue: [] });

  customizeTotalText = (data: any) => {
    return `${this.translate.instant('PURCHASE_RETURN.TOTAL')}: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  /** Phase 2B: only unposted (draft/pending) returns can be approved or rejected. */
  isUnposted = (e: any): boolean => {
    const status = e?.row?.data?.status ?? 'DRAFT';
    return status === 'DRAFT' || status === 'PENDING_APPROVAL';
  };

  async onApprove(e: any): Promise<void> {
    const ret = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translate.instant('PURCHASE_RETURN.APPROVE_CONFIRM_TITLE'),
      this.translate.instant('PURCHASE_RETURN.APPROVE_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseReturnService.approvePurchaseReturn(ret.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('PURCHASE_RETURN.APPROVE_SUCCESS'));
        window.location.reload();
      },
      error: (err) => {
        this.notificationService.showError(err?.error?.Message ?? this.translate.instant('PURCHASE_RETURN.ERROR_SAVING_RETURN'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const ret = e.row.data;
    const result = await this.notificationService.confirmAlertWithInput(
      this.translate.instant('PURCHASE_RETURN.REJECT_CONFIRM_TITLE'),
      this.translate.instant('PURCHASE_RETURN.REJECT_REASON_PROMPT')
    );
    if (!result.isConfirmed) return;

    const reason = (result.value ?? '').trim();
    this.purchaseReturnService.rejectPurchaseReturn(ret.id, reason).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translate.instant('PURCHASE_RETURN.REJECT_SUCCESS'));
        window.location.reload();
      },
      error: (err) => {
        this.notificationService.showError(err?.error?.Message ?? this.translate.instant('PURCHASE_RETURN.ERROR_SAVING_RETURN'));
      }
    });
  }
}