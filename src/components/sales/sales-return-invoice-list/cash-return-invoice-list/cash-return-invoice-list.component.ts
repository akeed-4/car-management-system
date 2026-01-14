import { Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SalesReturnInvoiceListComponent } from '../sales-return-invoice-list/sales-return-invoice-list.component';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SalesReturnService } from '@/src/services/sales-return.service';

@Component({
  selector: 'app-cash-return-invoice-list',
  standalone: true,
  imports: [SalesReturnInvoiceListComponent, TranslateModule],
  templateUrl: './cash-return-invoice-list.component.html',
  styleUrl: './cash-return-invoice-list.component.css'
})
export class SalesCashReturnInvoiceListComponent {
   customTitle: string = 'RETURN.CASH_LIST_TITLE';
  private salesReturnService = inject(SalesReturnService);
  private router = inject(Router);

  // Get all return invoices and filter for cash returns
  allReturnInvoices = toSignal(this.salesReturnService.getReturnInvoices(), { initialValue: [] });
  cashReturnInvoices = computed(() => {
    const all = this.allReturnInvoices();
    return all.filter(invoice => invoice.isCash === true);
  });
constructor() {
  console.log('Cash Return Invoices:', this.cashReturnInvoices());
}
  // Property to store received data from child component
  receivedData: any[] = [];
    returnInvoices = computed(() => {
      const all = this.allReturnInvoices();
        return all.filter(invoice => invoice.paymentMethod === 'Cash');
    });
  // Handle events from child component
  onViewDetails(invoice: any): void {
    console.log('Viewing cash return invoice details:', invoice);
    // Navigate to view page or open modal
    this.router.navigate(['/sales/return', invoice.id, 'view']);
  }

  onEdit(invoice: any): void {
    console.log('Editing cash return invoice:', invoice);
    // Navigate to edit page
    this.router.navigate(['/sales/return', invoice.id, 'edit']);
  }

  onDelete(invoice: any): void {
    console.log('Deleting cash return invoice:', invoice);
    if (confirm('Are you sure you want to delete this cash return invoice?')) {
      // Handle delete logic
      console.log('Cash return invoice deleted:', invoice.id);
    }
  }

  onAddNew(): void {
    console.log('Adding new cash return invoice');
    // Navigate to create page
    this.router.navigate(['/sales/return/new'], { queryParams: { type: 'cash' } });
  }
}
