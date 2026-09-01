import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

/**
 * Vehicle QR generation -- deliberately separate from QrCodeService (ZATCA/invoice QR). A vehicle
 * QR just encodes a plain public-page URL; it has no TLV payload, no company/tax fields, and no
 * QrCodeConfiguration coupling, so reusing QrCodeService would mean stuffing a URL into fields
 * shaped for seller name/VAT number/totals. Renders directly via the same underlying `qrcode`
 * package QrCodeService already depends on.
 */
@Injectable({ providedIn: 'root' })
export class VehicleQrService {
  async generateDataUrl(publicUrl: string, sizePx = 200): Promise<string> {
    return QRCode.toDataURL(publicUrl, {
      width: sizePx,
      margin: 1,
      color: { dark: '#1a2233', light: '#ffffff' },
    });
  }
}
