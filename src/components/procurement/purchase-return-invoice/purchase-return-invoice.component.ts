import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-purchase-return-invoice',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, TranslateModule],
  templateUrl: './purchase-return-invoice.component.html',
  styleUrl: './purchase-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnInvoiceComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  private translate = inject(TranslateService);
  returnInvoices = toSignal(this.purchaseReturnService.getReturnInvoices(), { initialValue: [] });
}