import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SalesInvoiceFormComponent } from '../sales-invoice-form.component';
import { SalesChannel } from '@/src/models/enums/sales-channel.enum';
import { SaleType } from '@/src/models/sales-enhancements.model';

@Component({
  selector: 'app-sales-invoice-cash',
  standalone: true,
  imports: [SalesInvoiceFormComponent],
  templateUrl: './sales-invoice-cash.component.html',
  styleUrls: ['./sales-invoice-cash.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceCashComponent {
  SalesChannel = SalesChannel;
  SaleType = SaleType;
}
