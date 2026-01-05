import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../../services/purchase-return.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-cash-return-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule],
  templateUrl: './cash-return-invoice-list.component.html',
  styleUrl: './cash-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CashReturnInvoiceListComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  returnInvoices = toSignal(this.purchaseReturnService.getReturnInvoices(), { initialValue: [] });

  filteredReturnInvoices = computed(() => this.returnInvoices().filter(invoice => invoice.returnType === 'CASH'));

  customizeTotalText = (data: any) => {
    return `${this.translate.instant('PURCHASE_RETURN.TOTAL')}: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  onPrintClick = (e: any) => {
    this.router.navigate(['/purchases/return/print', e.row.data.id]);
  };

  onEditClick = (e: any) => {
    this.router.navigate(['/purchases/return/edit', e.row.data.id]);
  };

  onDeleteClick = (e: any) => {
    if (confirm(this.translate.instant('PURCHASE_RETURN.DELETE_CONFIRM'))) {
      // Call delete service
      alert('Delete functionality not implemented yet');
    }
  };
}
