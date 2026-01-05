import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SalesInvoiceListComponent } from '../sales-invoice-list/sales-invoice-list.component';

@Component({
  selector: 'app-credit-invoice-list',
  standalone: true,
  imports: [SalesInvoiceListComponent, TranslateModule],
  templateUrl: './credit-invoice-list.component.html',
  styleUrl: './credit-invoice-list.component.css'
})
export class CreditInvoiceListComponent {

}
