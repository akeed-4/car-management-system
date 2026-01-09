import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SalesInvoiceListComponent } from '../sales-invoice-list/sales-invoice-list.component';
import { SalesService } from '../../../../services/sales.service';

@Component({
  selector: 'app-cash-invoice-list',
  standalone: true,
  imports: [SalesInvoiceListComponent, TranslateModule],
  templateUrl: './cash-invoice-list.component.html',
  styleUrl: './cash-invoice-list.component.css'
})
export class CashInvoiceListComponent {
   customTitle: string = 'SALES.CASH_TITLE';
   
   private salesService = inject(SalesService);
   allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });
   constructor() {
    console.log('CashInvoiceListComponent initialized'+this.allInvoices());
   }
   // Filter for cash invoices only
   cashInvoices = computed(() => {
     return this.allInvoices().filter(invoice => invoice.isCash === true);
   });
}
