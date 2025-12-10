import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SalesInvoice } from '../../types/sales-invoice.model';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { PosPaymentModalComponent } from '../shared/pos-payment-modal/pos-payment-modal.component';
import { PaymentGatewayService } from '../../services/payment-gateway.service';
import { PosPaymentStatus } from '../../types/pos-payment-status.model';
import { DealJacketModalComponent } from '../shared/deal-jacket-modal/deal-jacket-modal.component';
import { SalesService } from '../../services/sales.service';
import { DxDataGridModule } from 'devextreme-angular';
import { LanguageService } from '../../services/language.service';

type SortColumn = keyof SalesInvoice | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [RouterLink, FormsModule, PosPaymentModalComponent, DealJacketModalComponent, TranslateModule, DxDataGridModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesComponent {
  private salesService: SalesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  languageService = inject(LanguageService);
  private paymentGatewayService = inject(PaymentGatewayService);
  private router = inject(Router);
  
  invoices = toSignal(this.salesService.getInvoices(), { initialValue: [] });
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');
  showArchived = signal(false);
  
  transferringInvoices = signal(new Set<number>());

  // POS Payment Modal State
  isPosModalOpen = signal(false);
  currentPaymentInvoice = signal<SalesInvoice | null>(null);
  currentPaymentStatus = signal<PosPaymentStatus>('Pending');

  // Deal Jacket Modal State
  isDealJacketOpen = signal(false);
  selectedInvoiceForJacket = signal<SalesInvoice | null>(null);

  filteredAndSortedInvoices = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const showArchived = this.showArchived();

    let invoices = this.invoices().filter(inv => !!inv.isArchived === showArchived);

    // Filter
    if (searchTerm) {
      invoices = invoices.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
        invoice.customerName.toLowerCase().includes(searchTerm) ||
        invoice.status.toLowerCase().includes(searchTerm) ||
        invoice.items.some(item => item.carDescription.toLowerCase().includes(searchTerm))
      );
    }

    // Sort
    if (column && direction) {
      invoices = [...invoices].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (column === 'customerName') {
          aValue = a.customerName;
          bValue = b.customerName;
        } else if (column === 'invoiceDate') {
          aValue = new Date(a.invoiceDate);
          bValue = new Date(b.invoiceDate);
        } else if (column === 'totalAmount') {
          aValue = a.totalAmount;
          bValue = b.totalAmount;
        } else if (column === 'status') {
          aValue = a.status;
          bValue = b.status;
        } else if (column === 'amountPaid') { // Added for sorting
          aValue = a.amountPaid;
          bValue = b.amountPaid;
        } else if (column === 'amountDue') { // Added for sorting
          aValue = a.amountDue;
          bValue = b.amountDue;
        }
        else {
          aValue = a[column];
          bValue = b[column];
        }

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }

        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return invoices;
  });

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    if (this.sortDirection() === 'asc') return '▲';
    if (this.sortDirection() === 'desc') return '▼';
    return '';
  }
  
  async initiateTransfer(invoice: SalesInvoice) {
    this.transferringInvoices.update(set => new Set(set.add(invoice.id)));
    // Fix: Used the correctly typed salesService to call initiateOwnershipTransfer
    const success = await this.salesService.initiateOwnershipTransfer(invoice.id);
    /*
    if (success) {
      // This logic is now handled INSIDE salesService.initiateOwnershipTransfer
      // to ensure car status is updated only after successful transfer simulation.
      invoice.items.forEach(item => {
        this.inventoryService.finalizeSaleStatus(item.carId);
      });
    }
    */
    this.transferringInvoices.update(set => {
        const newSet = new Set(set);
        newSet.delete(invoice.id);
        return newSet;
    });
  }

  scheduleDelivery(invoiceId: number) {
    this.router.navigate(['/deliveries/schedule', invoiceId]);
  }

  async payWithPos(invoice: SalesInvoice) {
    this.currentPaymentInvoice.set(invoice);
    this.currentPaymentStatus.set('Pending');
    this.isPosModalOpen.set(true);
    
    const status = await this.paymentGatewayService.initiatePosPayment(invoice);
    this.currentPaymentStatus.set(status);
  }

  closePosModal() {
    this.isPosModalOpen.set(false);
    this.currentPaymentInvoice.set(null);
  }

  openDealJacket(invoice: SalesInvoice) {
    this.selectedInvoiceForJacket.set(invoice);
    this.isDealJacketOpen.set(true);
  }

  // Fix: Used salesService.archiveInvoice
  archiveInvoice(id: number) {
    this.salesService.archiveInvoice(id);
  }

  // Fix: Used salesService.unarchiveInvoice
  unarchiveInvoice(id: number) {
    this.salesService.unarchiveInvoice(id);
  }
}