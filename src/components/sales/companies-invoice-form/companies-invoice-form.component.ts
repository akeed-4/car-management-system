import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SalesInvoiceFormComponent } from '../sales-invoice-form/sales-invoice-form.component';

@Component({
  selector: 'app-companies-invoice-form',
  standalone: true,
  imports: [SalesInvoiceFormComponent],
  templateUrl: './companies-invoice-form.component.html',
  styleUrls: ['./companies-invoice-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesInvoiceFormComponent {}
