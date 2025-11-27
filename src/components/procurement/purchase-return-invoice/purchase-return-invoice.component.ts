import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseReturnService } from '../../../services/purchase-return.service';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-purchase-return-invoice',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './purchase-return-invoice.component.html',
  styleUrl: './purchase-return-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PurchaseReturnInvoiceComponent {
  private purchaseReturnService = inject(PurchaseReturnService);
  returnInvoices = this.purchaseReturnService.returnInvoices$;
}