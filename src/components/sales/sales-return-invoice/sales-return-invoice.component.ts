import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { SalesReturnService } from '../../../services/sales-return.service';

@Component({
  selector: 'app-sales-return-invoice',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule],
  templateUrl: './sales-return-invoice.component.html',
  styleUrl: './sales-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceComponent {
  private salesReturnService = inject(SalesReturnService);
  returnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });

  customizeTotalText = (data: any) => {
    return `الإجمالي الكلي: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' }) || '0 ر.س'}`;
  };

  customizeCountText = (data: any) => {
    return `عدد المرتجعات: ${data.value || 0}`;
  };
}