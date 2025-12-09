import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProcurementService } from '../../../services/procurement.service';
import { PurchaseInvoice } from '../../../types/purchase-invoice.model';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../types/supplier.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-printable-purchase-invoice',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './printable-purchase-invoice.component.html',
  styleUrl: './printable-purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintablePurchaseInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private procurementService = inject(ProcurementService);
  private supplierService = inject(SupplierService);

  invoice = signal<PurchaseInvoice | null>(null);
  supplier = signal<Supplier | null>(null);

  // Centralized company info
  companyInfo = {
    name: 'معرض سيارات',
    address: 'الرياض, المملكة العربية السعودية',
    crNumber: '1010123456',
  };

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.procurementService.getInvoiceById(id).subscribe(inv => {
          this.invoice.set(inv);
          this.supplierService.getSupplierById(inv.supplierId).subscribe(sup => {
            this.supplier.set(sup ?? null);
          });
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
