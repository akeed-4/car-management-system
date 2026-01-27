import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../models/sales-invoice.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CreditInvoiceListItem, creditInvoiceLanguageData } from './invoice-credit-list.model';

@Component({
  selector: 'app-invoice-credit-list',
  standalone: true,
  imports: [CommonModule, DxDataGridModule, DxButtonModule, TranslateModule],
  templateUrl: './invoice-credit-list.component.html',
  styleUrls: ['./invoice-credit-list.component.css']
})
export class InvoiceCreditListComponent implements OnInit {
  private salesService = inject(SalesService);
  private router = inject(Router);
  private translateService = inject(TranslateService);

  creditInvoices = signal<SalesInvoice[]>([]);

  // Local translations
  translations = creditInvoiceLanguageData.InvoiceCreditListDictionary;

  ngOnInit() {
    this.loadCreditInvoices();
  }

  loadCreditInvoices() {
    this.salesService.getInvoices().subscribe(invoices => {
      // Filter for credit invoices - paymentMethod is 'Finance' for credit sales
      this.creditInvoices.set(invoices.filter(inv => inv.paymentMethod === 'Finance'));
    });
  }

  getCaption(key: string): string {
    const currentLang = this.translateService.currentLang || 'en';
    return this.translations[currentLang]?.[key] || key;
  }

  onEditClick(e: any) {
    const invoiceId = e.row.data.id;
    // Navigate to edit credit invoice - assuming there's an edit route
    this.router.navigate(['/sales/invoice/edit', invoiceId]);
  }

  onDeleteClick(e: any) {
    const invoiceId = e.row.data.id;
    if (confirm('Are you sure you want to delete this invoice?')) {
      this.salesService.deleteInvoice(invoiceId).subscribe(() => {
        this.loadCreditInvoices(); // Reload the list
      });
    }
  }

  navigateToNewCreditInvoice() {
    this.router.navigate(['/sales/invoice/credit/new']);
  }
}