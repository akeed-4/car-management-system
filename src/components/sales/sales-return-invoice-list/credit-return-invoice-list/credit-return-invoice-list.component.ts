import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SalesReturnInvoiceListComponent } from '../sales-return-invoice-list/sales-return-invoice-list.component';

@Component({
  selector: 'app-credit-return-invoice-list',
  standalone: true,
  imports: [SalesReturnInvoiceListComponent, TranslateModule],
  templateUrl: './credit-return-invoice-list.component.html',
  styleUrl: './credit-return-invoice-list.component.css'
})
export class CreditReturnInvoiceListComponent {

}
