import { SalesReturnService } from '@/src/services/sales-return.service';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';

@Component({
  selector: 'app-cash-invoice-list',
  standalone: true,
 imports: [RouterLink, TranslateModule, DxDataGridModule],

  templateUrl: './cash-invoice-list.component.html',
  styleUrl: './cash-invoice-list.component.css'
})
export class CashInvoiceListComponent {
private salesReturnService = inject(SalesReturnService);
  returnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });

  customizeTotalText = (data: any) => {
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  customizeCountText = (data: any) => {
    return `عدد المرتجعات: ${data.value || 0}`;
  };
}
