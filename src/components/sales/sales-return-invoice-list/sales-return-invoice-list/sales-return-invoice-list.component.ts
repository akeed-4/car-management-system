import { ChangeDetectionStrategy, Component, inject, Input, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { SalesReturnService } from '../../../../services/sales-return.service';

@Component({
  selector: 'app-sales-return-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule],
  templateUrl: './sales-return-invoice-list.component.html',
  styleUrl: './sales-return-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceListComponent {
  @Input() isCashReturn: boolean = false;
  @Input() customTitle: any;

  private salesReturnService = inject(SalesReturnService);
  allReturnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });

  returnInvoices = computed(() => {
    const all = this.allReturnInvoices();
    if (this.isCashReturn) {
      // Filter for cash returns - assuming cash returns have paymentMethod === 'Cash'
      return all.filter(invoice => invoice.paymentMethod === 'Cash');
    } else {
      // Filter for credit returns - paymentMethod !== 'Cash'
      return all.filter(invoice => invoice.paymentMethod !== 'Cash');
    }
  });

  customizeTotalText = (data: any) => {
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  customizeCountText = (data: any) => {
    return `عدد المرتجعات: ${data.value || 0}`;
  };
}
