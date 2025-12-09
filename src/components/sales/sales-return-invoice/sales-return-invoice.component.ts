import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SalesReturnService } from '../../../services/sales-return.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-sales-return-invoice',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, TranslateModule],
  templateUrl: './sales-return-invoice.component.html',
  styleUrl: './sales-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesReturnInvoiceComponent {
  private salesReturnService = inject(SalesReturnService);
  returnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });
}