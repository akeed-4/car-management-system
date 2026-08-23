import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoicePrintData } from '../models/invoice-print.model';

/**
 * ============================================================================
 * INVOICE PRINT — EXPORT LAYER
 * ============================================================================
 * All document-output concerns live here, fully decoupled from the template:
 *  - print():        native browser print dialog (print CSS hides the toolbar)
 *  - downloadPdf():  html2canvas rasterization of the rendered A4 sheet into a
 *                    multi-page jsPDF document (raster approach chosen over
 *                    jsPDF's vector text API because the default PDF core
 *                    fonts contain no Arabic glyphs -- rasterizing the live
 *                    DOM renders Arabic/RTL perfectly and matches the on-screen
 *                    preview 1:1). Page numbers are stamped per PDF page.
 *  - email():        mailto: handoff with invoice summary pre-filled.
 */
@Injectable({ providedIn: 'root' })
export class InvoiceExportService {
  private translate = inject(TranslateService);

  /** Triggers the browser print dialog for the current document. The
   *  invoice-print stylesheet hides all `.no-print` chrome via @media print,
   *  so only the A4 sheet is rasterized by the printer. */
  print(): void {
    window.print();
  }

  /** Renders `element` (the .invoice-sheet node) into a downloadable A4 PDF. */
  async downloadPdf(element: HTMLElement, data: InvoicePrintData): Promise<void> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // First page
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);
    this.stampPageNumber(pdf, 1, Math.max(1, Math.ceil(imgHeight / pageHeight)));

    // Continuation pages: shift the same full-height image up by pageHeight
    // per page (classic multi-page slice technique).
    let remaining = imgHeight - pageHeight;
    let page = 2;
    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -(page - 1) * pageHeight, pageWidth, imgHeight);
      this.stampPageNumber(pdf, page, Math.max(1, Math.ceil(imgHeight / pageHeight)));
      remaining -= pageHeight;
      page++;
    }

    pdf.save(this.buildFileName(data));
  }

  /** Opens the user's mail client with an invoice summary pre-filled. */
  email(data: InvoicePrintData, recipient?: string): void {
    const subject = this.translate.instant('INVOICE_PRINT.EMAIL.SUBJECT', {
      number: data.invoiceNumber,
    });
    const body = this.translate.instant('INVOICE_PRINT.EMAIL.BODY', {
      number: data.invoiceNumber,
      date: data.issueDate,
      total: data.totals.grandTotal.toFixed(2),
      currency: data.currency,
      due: data.dueDate ?? '-',
    });
    const to = recipient ? `${recipient}?` : '?';
    window.location.href = `mailto:${to}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  private stampPageNumber(pdf: jsPDF, page: number, totalPages: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const label = this.translate.instant('INVOICE_PRINT.FOOTER.PAGE_OF', { page, totalPages });
    pdf.setFontSize(8);
    pdf.setTextColor(120);
    pdf.text(label, pageWidth / 2, pageHeight - 5, { align: 'center' });
    pdf.setTextColor(0);
  }

  private buildFileName(data: InvoicePrintData): string {
    const typeLabel = data.type.charAt(0).toUpperCase() + data.type.slice(1);
    const safeNumber = data.invoiceNumber.replace(/[^\w-]+/g, '_');
    return `${typeLabel}-Invoice-${safeNumber}.pdf`;
  }
}