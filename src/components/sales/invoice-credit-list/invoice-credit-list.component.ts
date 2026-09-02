import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { SalesService } from '../../../services/sales.service';
import { PermissionService } from '../../../services/permission.service';
import { SalesInvoice } from '../../../models/sales-invoice.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CreditInvoiceListItem, creditInvoiceLanguageData } from './invoice-credit-list.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-invoice-credit-list',
  standalone: true,
  imports: [CommonModule, SharedDataGridComponent, TranslateModule],
  templateUrl: './invoice-credit-list.component.html',
  styleUrls: ['./invoice-credit-list.component.css']
})
export class InvoiceCreditListComponent implements OnInit {
  private salesService = inject(SalesService);
  private router = inject(Router);
  private translateService = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  creditInvoices = signal<SalesInvoice[]>([]);

  // Local translations
  translations = creditInvoiceLanguageData.InvoiceCreditListDictionary;

  /** Config-driven columns -- captions come from the local dictionary (not
   *  ngx-translate keys), so they're resolved to plain text up front, same
   *  as getCaption() did for the old dxi-column captions. */
  get columns(): dataGridColumnDto[] {
    return [
      { dataField: 'invoiceNumber', dataType: 'string', caption: this.getCaption('INVOICE_NUMBER') },
      { dataField: 'customer.name', dataType: 'string', caption: this.getCaption('CUSTOMER') },
      { dataField: 'invoiceDate', dataType: 'date', caption: this.getCaption('INVOICE_DATE') },
      { dataField: 'dueDate', dataType: 'date', caption: this.getCaption('DUE_DATE') },
      { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: this.getCaption('TOTAL_AMOUNT') },
      { dataField: 'paymentMethod', dataType: 'string', caption: this.getCaption('PAYMENT_METHOD') },
      { dataField: 'status', dataType: 'string', caption: this.getCaption('STATUS') },
      { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', allowSorting: false, allowFiltering: false },
    ];
  }

  /** Same edit/delete named buttons as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('sales.credit.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('sales.credit.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEditClick(e.row);
    else if (e.actionId === 'delete') this.onDeleteClick(e.row);
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: SalesInvoice) => item.invoiceNumber;
  mobileTrackBy = (_index: number, item: SalesInvoice) => item.id;

  mobileFields: MobileCardField<SalesInvoice>[] = [
    { label: 'INVOICE.CUSTOMER', value: (item) => item.customerName },
    { label: 'INVOICE.INVOICE_DATE', value: (item) => item.invoiceDate },
    { label: 'INVOICE.DUE_DATE', value: (item) => item.dueDate },
    { label: 'INVOICE.TOTAL', value: (item) => item.totalAmount },
    { label: 'INVOICE.PAYMENT_METHOD', value: (item) => item.paymentMethod },
    { label: 'INVOICE.STATUS', value: (item) => item.status },
  ];

  mobileEditClick(item: SalesInvoice): void {
    this.onEditClick({ row: { data: item } });
  }

  mobileDeleteClick(item: SalesInvoice): void {
    this.onDeleteClick({ row: { data: item } });
  }

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
    const invoiceId = (e?.row?.data ?? e)?.id;
    // Navigate to edit credit invoice - assuming there's an edit route
    this.router.navigate(['/sales/invoice/edit', invoiceId]);
  }

  onDeleteClick(e: any) {
    const invoiceId = (e?.row?.data ?? e)?.id;
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
