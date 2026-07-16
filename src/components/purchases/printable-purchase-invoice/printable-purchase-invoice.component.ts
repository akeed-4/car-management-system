import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PurchasesService } from '../../../services/purchases.service';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Location } from '@angular/common';
import { CompanyService } from '../../../services/company.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { QrCodeContext } from '../../../models/qr-code.model';
import { Company } from '../../../models/branch.model';

@Component({
  selector: 'app-printable-purchase-invoice',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, QrCodeComponent],
  templateUrl: './printable-purchase-invoice.component.html',
  styleUrl: './printable-purchase-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintablePurchaseInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private purchasesService = inject(PurchasesService);
  private supplierService = inject(SupplierService);
  private companyService = inject(CompanyService);
  private currentSettingService = inject(CurrentSettingService);

  invoice = signal<PurchaseInvoice | null>(null);
  supplier = signal<Supplier | null>(null);
  company = signal<Company | null>(null);

  // Sourced from the real Company record (CompanyService) -- no longer hardcoded, and no
  // longer duplicated independently of printable-sales-invoice's own copy of the same data.
  companyInfo = computed(() => {
    const c = this.company();
    return {
      name: c ? (c.nameAr || c.nameEn) : '',
      address: c?.address ? `${c.address.city ?? ''} ${c.address.country ?? ''}`.trim() : '',
      crNumber: c?.crNumber ?? '',
      phone: '',
      email: ''
    };
  });

  /** ZATCA "seller" on a Purchase Invoice is the supplier, not our own company -- the reverse of
   * the Sales Invoice case, where we are the seller. */
  qrContext = computed<QrCodeContext | null>(() => {
    const inv = this.invoice();
    const sup = this.supplier();
    const c = this.company();
    if (!inv || !sup) return null;
    const totalBeforeVat = inv.totalAmount / 1.15;
    const vatAmount = inv.totalAmount - totalBeforeVat;
    return {
      companyName: sup.name,
      vatNumber: sup.taxNumber ?? '',
      crNumber: sup.crNumber,
      documentNumber: inv.invoiceNumber,
      documentDate: new Date(inv.invoiceDate),
      customerName: c ? (c.nameAr || c.nameEn) : undefined,
      customerVatNumber: c?.vatRegistrationNumber,
      currency: 'SAR',
      totalBeforeVat,
      vatAmount,
      grandTotal: inv.totalAmount
    };
  });

  // Current year for footer
  currentYear = new Date().getFullYear();

  constructor() {
    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.purchasesService.getInvoiceById(id).subscribe(inv => {
          this.invoice.set(inv);
          this.supplierService.getSupplierById(inv.supplierId).subscribe(sup => {
            this.supplier.set(sup ?? null);
          });
        });
      }
    }, { allowSignalWrites: true });

    this.companyService.getById(this.currentSettingService.getCompanyId()).subscribe({
      next: (c) => this.company.set(c),
      error: (error) => console.error('Error loading company info:', error)
    });
  }

  printInvoice(): void {
    window.print();
  }

  goBack(): void {
    this.location.back();
  }
}
