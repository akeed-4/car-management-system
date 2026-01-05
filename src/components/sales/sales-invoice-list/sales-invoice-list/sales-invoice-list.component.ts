import { ChangeDetectionStrategy, Component, inject, Input, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule } from 'devextreme-angular';
import { SalesService } from '../../../../services/sales.service';

@Component({
  selector: 'app-sales-invoice-list',
  standalone: true,
  imports: [RouterLink, TranslateModule, DxDataGridModule],
  templateUrl: './sales-invoice-list.component.html',
  styleUrl: './sales-invoice-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceListComponent {
  @Input() isCashInvoice: boolean = false;
  @Input() customTitle: any;

  private salesService = inject(SalesService);
  allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });

  invoices = computed(() => {
    const all = this.allInvoices();
    if (this.isCashInvoice) {
      // Filter for cash invoices - assuming cash invoices have paymentMethod === 'Cash'
      return all.filter(invoice => invoice.paymentMethod === 'Cash');
    } else {
      // Filter for credit invoices - paymentMethod !== 'Cash'
      return all.filter(invoice => invoice.paymentMethod !== 'Cash');
    }
  });

  customizeTotalText = (data: any) => {
    return `المجموع: ${data.value?.toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' })}`;
  };

  customizeCountText = (data: any) => {
    return `عدد الفواتير: ${data.value}`;
  }
}
