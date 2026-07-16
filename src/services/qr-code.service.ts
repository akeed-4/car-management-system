import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';
import { QrCodeConfigurationDto, QrCodeContext, QR_PLAIN_CONTENT_FIELDS } from '../models/qr-code.model';

/**
 * Core, document-agnostic QR logic: builds the payload string (ZATCA TLV/Base64, or a
 * configurable plain-text template) and renders it to a data-URL image. Framework-agnostic of
 * any specific document -- callers assemble a QrCodeContext once and pass it in. Reused by both
 * the live <app-qr-code> component and any print-string HTML builder (e.g.
 * printable-sales-invoice's generateInvoiceHtml()) so the payload/image logic is never
 * duplicated between the live view and the print path.
 */
@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  /** Generated once per (payload, config) pair per print session -- avoids regenerating the QR
   * matrix redundantly across print preview / actual print / PDF export of the same document. */
  private dataUrlCache = new Map<string, string>();

  /**
   * ZATCA TLV encoder: 5 fixed tags (Seller Name, VAT Number, ISO-8601 Timestamp, Invoice Total,
   * VAT Total), each Tag-Length-Value with UTF-8 byte lengths, concatenated then Base64-encoded.
   * Hand-rolled per ZATCA's published spec -- no external dependency for this compliance-critical
   * encoding.
   */
  buildZatcaPayload(context: QrCodeContext): string {
    const tags: Array<[number, string]> = [
      [1, context.companyName],
      [2, context.vatNumber],
      [3, context.documentDate.toISOString()],
      [4, context.grandTotal.toFixed(2)],
      [5, context.vatAmount.toFixed(2)]
    ];

    const bytes: number[] = [];
    for (const [tag, value] of tags) {
      const valueBytes = Array.from(new TextEncoder().encode(value));
      bytes.push(tag, valueBytes.length, ...valueBytes);
    }

    return this.bytesToBase64(bytes);
  }

  /** Non-ZATCA fallback: a configurable, human-readable plain-text payload built from whichever
   * QrCodeContext fields the company's QrCodeConfiguration selects. */
  buildPlainPayload(context: QrCodeContext, fields: string[]): string {
    const lines: string[] = [];
    for (const field of fields) {
      const def = QR_PLAIN_CONTENT_FIELDS.find(f => f.value === field);
      if (!def) continue;
      const raw = (context as any)[field];
      if (raw === undefined || raw === null || raw === '') continue;
      const value = raw instanceof Date ? raw.toISOString() : String(raw);
      lines.push(value);
    }
    if (context.extraFields) {
      for (const value of Object.values(context.extraFields)) {
        if (value) lines.push(value);
      }
    }
    return lines.join('\n');
  }

  /** Builds the appropriate payload (ZATCA TLV or plain) per config, then renders it to a PNG
   * data-URL sized/colored per config. Plain string result -- usable both for a live Angular
   * <img [src]> binding and for direct interpolation into a print-string HTML template. */
  async generateQrDataUrl(context: QrCodeContext, config: QrCodeConfigurationDto): Promise<string> {
    const payload = config.zatcaModeEnabled
      ? this.buildZatcaPayload(context)
      : this.buildPlainPayload(context, this.parseContentFields(config.contentFieldsJson));

    const cacheKey = `${payload}|${config.sizePx}|${config.marginPx}|${config.foregroundColor}`;
    const cached = this.dataUrlCache.get(cacheKey);
    if (cached) return cached;

    const dataUrl = await QRCode.toDataURL(payload, {
      width: config.sizePx,
      margin: Math.max(0, Math.round(config.marginPx / 4)), // qrcode's margin unit is "modules", not px
      color: {
        dark: config.foregroundColor,
        light: '#FFFFFF'
      }
    });

    this.dataUrlCache.set(cacheKey, dataUrl);
    return dataUrl;
  }

  private parseContentFields(json?: string): string[] {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private bytesToBase64(bytes: number[]): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
}
