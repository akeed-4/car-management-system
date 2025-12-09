import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../types/sales-invoice.model';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../types/customer.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-printable-sales-invoice',
  standalone: true,
  imports: [CurrencyPipe, TranslateModule],
  templateUrl: './printable-sales-invoice.component.html',
  styleUrl: './printable-sales-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintableSalesInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private salesService = inject(SalesService);
  private customerService = inject(CustomerService);

  invoice = signal<SalesInvoice | null>(null);
  customer = signal<Customer | null>(null);
  
  // Centralized company info
  companyInfo = {
    name: 'معرض سيارات',
    address: 'الرياض, المملكة العربية السعودية',
    taxNumber: '310123456789013',
    phone: '920012345',
  };

  isPaid = computed(() => this.invoice()?.status === 'Paid');

  transferStatusText = computed(() => {
    const status = this.invoice()?.ownershipTransferStatus;
    switch (status) {
      case 'Not Started': return 'لم تبدأ';
      case 'In Progress': return 'قيد التنفيذ';
      case 'Completed': return 'مكتملة';
      case 'Failed': return 'فشلت';
      default: return 'غير معروف';
    }
  });

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.salesService.getInvoiceById(id).subscribe(inv => {
          if (inv) {
            this.invoice.set(inv);
            this.customer.set(this.customerService.getCustomerById(inv.customerId) ?? null);
          }
        });
      }
    }, { allowSignalWrites: true });
  }

  printInvoice(): void {
    window.print();
  }

  goBack(): void {
    this.location.back();
  }
}