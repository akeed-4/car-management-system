import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { SalesInvoiceListComponent } from '../sales-invoice-list/sales-invoice-list.component';
import { SalesService } from '../../../../services/sales.service';

@Component({
  selector: 'app-credit-invoice-list',
  standalone: true,
  imports: [SalesInvoiceListComponent, TranslateModule],
  templateUrl: './credit-invoice-list.component.html',
  styleUrl: './credit-invoice-list.component.css'
})
export class CreditInvoiceListComponent {
   customTitle: string = 'SALES.CREDIT_TITLE';
   private salesService = inject(SalesService);
   allInvoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });
   
   // Filter for credit invoices only (non-cash)
   creditInvoices = computed(() => {
     return this.allInvoices().filter(invoice => invoice.isCash === false || invoice.isCash === undefined);
   });
}
