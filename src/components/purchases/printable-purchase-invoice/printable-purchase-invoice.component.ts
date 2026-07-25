import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PurchasesService } from '../../../services/purchases.service';
import { PurchaseInvoice } from '../../../models/purchase-invoice.model';
import { SupplierService } from '../../../services/supplier.service';
import { Supplier } from '../../../models/supplier.model';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { Location } from '@angular/common';
import { CompanyService } from '../../../services/company.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { LanguageService } from '../../../services/language.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { QrCodeContext } from '../../../models/qr-code.model';
import { Company } from '../../../models/branch.model';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-printable-purchase-invoice',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, QrCodeComponent, TranslateModule, MatIconModule],
  templateUrl: './printable-purchase-invoice.component.html',
  styleUrls: ['./printable-purchase-invoice.component.css', '../../shared/printable-invoice/printable-invoice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintablePurchaseInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private purchasesService = inject(PurchasesService);
  private supplierService = inject(SupplierService);
  private companyService = inject(CompanyService);
  private currentSettingService = inject(CurrentSettingService);
  private languageService = inject(LanguageService);
  private document = inject(DOCUMENT);

  invoice = signal<PurchaseInvoice | null>(null);
  supplier = signal<Supplier | null>(null);
  company = signal<Company | null>(null);

  // This route lives outside <app-layout>, so nothing else in the app sets <html dir/lang> for
  // it -- LayoutComponent normally owns that, but it is never instantiated on a print page.
  textDir = signal<'ltr' | 'rtl'>(this.languageService.getCurrentLanguage() === 'en' ? 'ltr' : 'rtl');

  private hasAutoPrinted = false;

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
    const tax = this.taxSummary();
    if (!inv || !sup || !tax) return null;
    return {
      companyName: sup.name,
      vatNumber: sup.taxNumber ?? '',
      crNumber: sup.crNumber,
      documentNumber: inv.invoiceNumber,
      documentDate: new Date(inv.invoiceDate),
      customerName: c ? (c.nameAr || c.nameEn) : undefined,
      customerVatNumber: c?.vatRegistrationNumber,
      currency: 'SAR',
      totalBeforeVat: tax.taxableAmount,
      vatAmount: tax.vatAmount,
      grandTotal: inv.totalAmount
    };
  });

  /** Single source of truth for the VAT breakdown -- feeds both the Totals box and the
   * dedicated Tax Summary section so the two can never disagree. Trusts the backend's persisted
   * subtotal/vatAmount when present (always correct for both standard and profit-margin-VAT
   * invoices); only falls back to the flat-15%-back-out estimate when those fields are absent,
   * which today is the common case for standard invoices (the backend currently only populates
   * them when the invoice contains a profit-margin-VAT car) -- this estimate is wrong for a
   * margin invoice, which is exactly why the persisted-field path takes priority whenever available. */
  taxSummary = computed(() => {
    const inv = this.invoice();
    if (!inv) return null;
    const hasPersistedBreakdown = inv.subtotal != null && inv.vatAmount != null;
    const taxableAmount = hasPersistedBreakdown ? inv.subtotal! : inv.totalAmount / 1.15;
    const vatAmount = hasPersistedBreakdown ? inv.vatAmount! : inv.totalAmount - taxableAmount;
    const rate = taxableAmount > 0 ? Math.round((vatAmount / taxableAmount) * 100) : 0;
    return { rate, taxableAmount, vatAmount, total: inv.totalAmount };
  });

  // Current year for footer
  currentYear = new Date().getFullYear();

  constructor() {
    // Apply the current language's direction immediately, then keep it in sync -- this page has
    // no LayoutComponent ancestor to do it for us (see `textDir` field comment above).
    this.applyDirection(this.languageService.getCurrentLanguage());
    this.languageService.language$.subscribe(lang => this.applyDirection(lang));

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

    // Auto-trigger the print dialog once the document has real data to show (invoice + company),
    // per the dedicated print-route contract: load -> render -> print, no manual click required.
    effect(() => {
      if (!this.hasAutoPrinted && this.invoice() && this.company()) {
        this.hasAutoPrinted = true;
        setTimeout(() => window.print(), 300);
      }
    });

    // This page is always opened in its own tab/window (see purchases list `window.open` calls),
    // so it is safe/expected to close itself once the user finishes with the print dialog.
    window.onafterprint = () => window.close();
  }

  private applyDirection(lang: string): void {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    this.textDir.set(dir);
    const htmlTag = this.document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    htmlTag.dir = dir;
    htmlTag.lang = lang;
  }

  printInvoice(): void {
    window.print();
  }

  goBack(): void {
    if (window.opener || window.history.length <= 1) {
      window.close();
    } else {
      this.location.back();
    }
  }
}
