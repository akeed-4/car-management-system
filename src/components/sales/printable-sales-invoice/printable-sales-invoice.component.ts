import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../models/sales-invoice.model';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { CompanyService } from '../../../services/company.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { LanguageService } from '../../../services/language.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { QrCodeContext } from '../../../models/qr-code.model';
import { Company } from '../../../models/branch.model';
import { DiscountType } from '../../../models/sales-invoice-financials';
import { SalesInvoiceCalculationService } from '../../../services/sales-invoice-calculation.service';

export interface SalesInvoicePrintBreakdown {
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  amountAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  previousPayments: number;
  downPayment: number;
  currentPayment: number;
  amountPaid: number;
  remainingBalance: number;
}

@Component({
  selector: 'app-printable-sales-invoice',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TranslateModule, MatIconModule, QrCodeComponent],
  templateUrl: './printable-sales-invoice.component.html',
  styleUrls: ['./printable-sales-invoice.component.css', '../../shared/printable-invoice/printable-invoice.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintableSalesInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private salesService = inject(SalesService);
  private customerService = inject(CustomerService);
  private companyService = inject(CompanyService);
  private currentSettingService = inject(CurrentSettingService);
  private calc = inject(SalesInvoiceCalculationService);
  private languageService = inject(LanguageService);
  private document = inject(DOCUMENT);

  invoice = signal<SalesInvoice | null>(null);
  customer = signal<Customer | null>(null);
  company = signal<Company | null>(null);

  // This route lives outside <app-layout>, so nothing else in the app sets <html dir/lang> for
  // it -- LayoutComponent normally owns that, but it is never instantiated on a print page.
  textDir = signal<'ltr' | 'rtl'>(this.languageService.getCurrentLanguage() === 'en' ? 'ltr' : 'rtl');

  private hasAutoPrinted = false;

  // Sourced from the real Company record (CompanyService) -- no longer hardcoded.
  companyInfo = computed(() => {
    const c = this.company();
    return {
      name: c ? (c.nameAr || c.nameEn) : '',
      address: c?.address ? `${c.address.city ?? ''} ${c.address.country ?? ''}`.trim() : '',
      taxNumber: c?.vatRegistrationNumber ?? '',
      phone: '',
    };
  });

  qrContext = computed<QrCodeContext | null>(() => {
    const inv = this.invoice();
    const cust = this.customer();
    const c = this.company();
    if (!inv || !c) return null;
    return {
      companyName: c.nameAr || c.nameEn,
      vatNumber: c.vatRegistrationNumber ?? '',
      crNumber: c.crNumber,
      documentNumber: inv.invoiceNumber,
      documentDate: new Date(inv.invoiceDate),
      customerName: cust?.name,
      currency: 'SAR',
      totalBeforeVat: inv.subtotal,
      vatAmount: inv.vatAmount,
      grandTotal: inv.totalAmount
    };
  });

  /** Prefers the invoice's own persisted breakdown fields (authoritative once the backend returns
   * them) and only fills gaps for older invoices that predate this breakdown -- this guarantees
   * the print view can never disagree with what was actually saved/shown on the create/edit form. */
  printBreakdown = computed<SalesInvoicePrintBreakdown | null>(() => {
    const inv = this.invoice();
    if (!inv) return null;

    const vatRate = inv.vatRate ?? this.calc.resolveVatRate(null, inv.invoiceType ?? null);
    const discountType: DiscountType = inv.discountType ?? 'Fixed';
    const discountValue = inv.discountValue ?? 0;
    const discountAmount = inv.discountAmount ?? this.calc.calculateDiscountAmount(inv.subtotal, discountType, discountValue);
    const amountAfterDiscount = inv.amountAfterDiscount ?? Math.max(0, inv.subtotal - discountAmount);
    const previousPayments = inv.previousPayments ?? 0;
    const downPayment = inv.downPayment ?? 0;
    const currentPayment = inv.currentPayment ?? Math.max(0, inv.amountPaid - previousPayments);
    const remainingBalance = inv.remainingBalance ?? inv.amountDue;

    return {
      subtotal: inv.subtotal,
      discountType,
      discountValue,
      discountAmount,
      amountAfterDiscount,
      vatRate,
      vatAmount: inv.vatAmount,
      totalAmount: inv.totalAmount,
      previousPayments,
      downPayment,
      currentPayment,
      amountPaid: inv.amountPaid,
      remainingBalance,
    };
  });

  constructor() {
    // Apply the current language's direction immediately, then keep it in sync -- this page has
    // no LayoutComponent ancestor to do it for us (see `textDir` field comment above).
    this.applyDirection(this.languageService.getCurrentLanguage());
    this.languageService.language$.subscribe(lang => this.applyDirection(lang));

    effect(() => {
      const idParam = this.route.snapshot.params['id'];
      if (idParam) {
        const id = Number(idParam);
        this.salesService.getInvoiceById(id).subscribe(inv => {
          if (inv) {
            this.invoice.set(inv);
            this.customerService.getCustomerById(inv.customerId).then(customer => {
              this.customer.set(customer ?? null);
            }).catch(error => {
              console.error('Error loading customer:', error);
              this.customer.set(null);
            });
          }
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

    // This page is always opened in its own tab/window (see sales list `window.open` calls), so
    // it is safe/expected to close itself once the user finishes with the print dialog.
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