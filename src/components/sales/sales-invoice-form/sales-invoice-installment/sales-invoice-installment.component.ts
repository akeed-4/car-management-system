import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SalesInvoiceFormComponent } from '../sales-invoice-form.component';
import { SalesChannel } from '@/src/models/enums/sales-channel.enum';
import { SaleType } from '@/src/models/sales-enhancements.model';

@Component({
  selector: 'app-sales-invoice-installment',
  standalone: true,
  imports: [SalesInvoiceFormComponent],
  templateUrl: './sales-invoice-installment.component.html',
  styleUrls: ['./sales-invoice-installment.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesInvoiceInstallmentComponent {
  SalesChannel = SalesChannel;
  SaleType = SaleType;
}
