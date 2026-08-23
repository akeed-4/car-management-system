import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe, DOCUMENT } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { Location } from '@angular/common';
import { InvoicePrintDataService } from '../../../services/invoice-print-data.service';
import { InvoiceExportService } from '../../../services/invoice-export.service';
import { LanguageService } from '../../../services/language.service';
import { QrCodeComponent } from '../qr-code/qr-code.component';
import {
  InvoicePrintData,
  InvoiceType,
  INVOICE_TYPE_ROUTE_KEY,
} from '../../../models/invoice-print.model';

/**
 * ============================================================================
 * INVOICE PRINT — TEMPLATE LAYER
 * ============================================================================
 * One professional, print-ready A4 component for ALL invoice types
 * (sales / purchase / service) in both Arabic (RTL) and English (LTR).
 *
 * The component is deliberately thin: data normalization lives in the data
 * layer (InvoicePrintDataService) and output concerns live in the export
 * layer (InvoiceExportService). This file only orchestrates loading,
 * direction, and user actions.
 *
 * Routing contract (see app.routes.ts):
 *   /sales/invoice/print/:id      -> data: { invoiceType: 'sales' }
 *   /purchases/invoice/print/:id  -> data: { invoiceType: 'purchase' }
 *   /service/invoice/print/:id    -> data: { invoiceType: 'service' }
 *   /invoices/print/:type/:id     -> type taken from the URL segment
 *   ?copy=true                    -> forces the COPY watermark
 *
 * These routes are bare pages (no LayoutComponent shell) so window.print()
 * rasterizes only the invoice sheet; the toolbar is hidden via @media print.
 */
@Component({
  selector: 'app-invoice-print',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TranslateModule, MatIconModule, QrCodeComponent],
  templateUrl: './invoice-print.component.html',
  styleUrl: './invoice-print.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoicePrintComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private dataService = inject(InvoicePrintDataService);
  private exportService = inject(InvoiceExportService);
  private languageService = inject(LanguageService);
  private document = inject(DOCUMENT);
  private host = inject(ElementRef<HTMLElement>);

  data = signal<InvoicePrintData | null>(null);
  loading = signal(true);
  notFound = signal(false);
  exporting = signal(false);

  /** This route lives outside <app-layout>, so nothing else sets <html dir/lang>
   *  for it -- LayoutComponent normally owns that but is never instantiated on
   *  a print page. */
  textDir = signal<'ltr' | 'rtl'>(this.languageService.getCurrentLanguage() === 'en' ? 'ltr' : 'rtl');

  private hasAutoPrinted = false;

  // ------------------------------------------------------------- view helpers

  /** Document title per invoice type, e.g. "Tax Invoice" / "Purchase Invoice" / "Service Invoice". */
  titleKey = computed(() => {
    switch (this.data()?.type) {
      case 'purchase': return 'INVOICE_PRINT.TITLE.PURCHASE';
      case 'service': return 'INVOICE_PRINT.TITLE.SERVICE';
      default: return 'INVOICE_PRINT.TITLE.SALES';
    }
  });

  /** Party block heading: customer for sales/service, supplier for purchase. */
  partyHeadingKey = computed(() =>
    this.data()?.type === 'purchase' ? 'INVOICE_PRINT.PARTY.SUPPLIER' : 'INVOICE_PRINT.PARTY.CUSTOMER');

  /** Counterparty heading: our company for purchase, otherwise the customer side. */
  counterpartyHeadingKey = computed(() =>
    this.data()?.type === 'purchase' ? 'INVOICE_PRINT.PARTY.BUYER' : 'INVOICE_PRINT.PARTY.SELLER');

  /** Qty column header: "Hours" for service invoices, "Qty" otherwise. */
  qtyColumnKey = computed(() =>
    this.data()?.items.some(i => i.unit === 'hour') ? 'INVOICE_PRINT.TABLE.HOURS' : 'INVOICE_PRINT.TABLE.QTY');

  /** Purchase invoices carry issuer + receiver signature blocks; the other
   *  types use prepared-by + received-by. */
  signatureMode = computed<'issuerReceiver' | 'preparedReceived'>(() =>
    this.data()?.type === 'purchase' ? 'issuerReceiver' : 'preparedReceived');

  hasBankDetails = computed(() => {
    const b = this.data()?.bankDetails;
    return !!b && Object.values(b).some(v => !!v && String(v).trim().length > 0);
  });

  watermarkClass = computed(() => {
    const w = this.data()?.watermark ?? 'NONE';
    return w === 'NONE' ? '' : `watermark-${w.toLowerCase()}`;
  });

  constructor() {
    // Apply the current language's direction immediately, then keep it in sync.
    this.applyDirection(this.languageService.getCurrentLanguage());
    this.languageService.language$.subscribe(lang => this.applyDirection(lang));

    effect(() => this.loadFromRoute(), { allowSignalWrites: true });

    // Auto-trigger the print dialog once the document has real data, per the
    // dedicated print-route contract: load -> render -> print. The on-screen
    // toolbar lets the user re-print, download a PDF, or email instead.
    effect(() => {
      if (!this.hasAutoPrinted && this.data()) {
        this.hasAutoPrinted = true;
        setTimeout(() => window.print(), 300);
      }
    });

    // This page is always opened in its own tab/window by the list grids, so
    // it is safe/expected to close itself once the user finishes printing.
    window.onafterprint = () => window.close();
  }

  private loadFromRoute(): void {
    const type = this.resolveType();
    const idParam = this.route.snapshot.params['id'];
    const isCopy = this.route.snapshot.queryParamMap.get('copy') === 'true';
    if (!type || !idParam) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.notFound.set(false);
    this.dataService.load(type, Number(idParam), { isCopy }).subscribe(result => {
      this.loading.set(false);
      if (result) {
        this.data.set(result);
      } else {
        this.notFound.set(true);
      }
    });
  }

  /** Type from route `data.invoiceType`, falling back to the /invoices/print/:type/:id segment. */
  private resolveType(): InvoiceType | null {
    const fromData = this.route.snapshot.data[INVOICE_TYPE_ROUTE_KEY] as InvoiceType | undefined;
    if (fromData) return fromData;
    const segment = this.route.snapshot.params['type'] as string | undefined;
    return segment === 'sales' || segment === 'purchase' || segment === 'service' ? segment : null;
  }

  private applyDirection(lang: string): void {
    const dir = lang === 'en' ? 'ltr' : 'rtl';
    this.textDir.set(dir);
    const htmlTag = this.document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    htmlTag.dir = dir;
    htmlTag.lang = lang;
  }

  // ------------------------------------------------------------------ actions

  print(): void {
    this.exportService.print();
  }

  async downloadPdf(): Promise<void> {
    const data = this.data();
    const sheet = this.host.nativeElement.querySelector('.invoice-sheet') as HTMLElement | null;
    if (!data || !sheet) return;
    this.exporting.set(true);
    try {
      await this.exportService.downloadPdf(sheet, data);
    } finally {
      this.exporting.set(false);
    }
  }

  email(): void {
    const data = this.data();
    if (data) this.exportService.email(data);
  }

  goBack(): void {
    if (window.opener || window.history.length <= 1) {
      window.close();
    } else {
      this.location.back();
    }
  }
}