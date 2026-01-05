import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SalesInvoiceListComponent } from '../sales-invoice-list/sales-invoice-list.component';

@Component({
  selector: 'app-cash-invoice-list',
  standalone: true,
  imports: [SalesInvoiceListComponent, TranslateModule],
  templateUrl: './cash-invoice-list.component.html',
  styleUrl: './cash-invoice-list.component.css'
})
export class CashInvoiceListComponent {

}
