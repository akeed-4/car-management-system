import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';

@Component({
  selector: 'app-direct-invoice-form',
  standalone: true,
  imports: [SalesInvoiceFormComponent],
  templateUrl: './direct-invoice-form.component.html',
  styleUrls: ['./direct-invoice-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectInvoiceFormComponent {}
