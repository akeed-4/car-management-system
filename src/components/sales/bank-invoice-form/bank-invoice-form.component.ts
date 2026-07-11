import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { SaleType } from '../../../models/sales-enhancements.model';

@Component({
  selector: 'app-bank-invoice-form',
  standalone: true,
  imports: [SalesInvoiceFormComponent],
  templateUrl: './bank-invoice-form.component.html',
  styleUrls: ['./bank-invoice-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankInvoiceFormComponent {
  SalesChannel = SalesChannel;
  SaleType = SaleType;
}