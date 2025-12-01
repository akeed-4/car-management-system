import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalesReturnService } from '../../../services/sales-return.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-sales-return-invoice',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './sales-return-invoice.component.html',
  styleUrl: './sales-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceComponent {
  private salesReturnService = inject(SalesReturnService);
  returnInvoices = this.salesReturnService.returnInvoices$;
}