import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SalesReturnInvoiceListComponent } from '../sales-return-invoice-list/sales-return-invoice-list.component';
import { Router } from '@angular/router';
import { SalesReturnService } from '@/src/services/sales-return.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-credit-return-invoice-list',
  standalone: true,
  imports: [SalesReturnInvoiceListComponent, TranslateModule],
  templateUrl: './credit-return-invoice-list.component.html',
  styleUrl: './credit-return-invoice-list.component.css'
})
export class SalesCreditReturnInvoiceListComponent {
    customTitle: string = 'SALES.RETURN.CREDIT_LIST_TITLE';
  private salesReturnService = inject(SalesReturnService);
  private router = inject(Router);

  // Get all return invoices and filter for credit returns
  allReturnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });
  creditReturnInvoices = computed(() => {
    const all = this.allReturnInvoices();
    return all.filter(invoice => invoice.paymentMethod !== 'Cash');
  });

  // Property to store received data from child component
  receivedData: any[] = [];

  // Handle events from child component
  onViewDetails(invoice: any): void {
    console.log('Viewing credit return invoice details:', invoice);
    // Navigate to view page or open modal
    this.router.navigate(['/sales/return', invoice.id, 'view']);
  }

  onEdit(invoice: any): void {
    console.log('Editing credit return invoice:', invoice);
    // Navigate to edit page
    this.router.navigate(['/sales/return', invoice.id, 'edit']);
  }

  onDelete(invoice: any): void {
    console.log('Deleting credit return invoice:', invoice);
    if (confirm('Are you sure you want to delete this credit return invoice?')) {
      // Handle delete logic
      console.log('Credit return invoice deleted:', invoice.id);
    }
  }

  onAddNew(): void {
    console.log('Adding new credit return invoice');
    // Navigate to create page
    this.router.navigate(['/sales/return/new'], { queryParams: { type: 'credit' } });
  }

  onDataSourceReady(data: any[]): void {

    this.receivedData= data;
    // Handle datasource ready - can be used for additional processing
    // For example: update parent component state, trigger analytics, etc.
  }
}
