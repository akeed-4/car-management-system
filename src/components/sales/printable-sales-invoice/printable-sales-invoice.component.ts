import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SalesService } from '../../../services/sales.service';
import { SalesInvoice } from '../../../models/sales-invoice.model';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PrintService } from '../../../services/print.service';
import { CompanyService } from '../../../services/company.service';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { QrCodeService } from '../../../services/qr-code.service';
import { QrCodeConfigurationService } from '../../../services/qr-code-configuration.service';
import { QrCodeComponent } from '../../shared/qr-code/qr-code.component';
import { QrCodeContext } from '../../../models/qr-code.model';
import { Company } from '../../../models/branch.model';

@Component({
  selector: 'app-printable-sales-invoice',
  standalone: true,
  imports: [CurrencyPipe, TranslateModule, MatIconModule, QrCodeComponent],
  templateUrl: './printable-sales-invoice.component.html',
  styleUrl: './printable-sales-invoice.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrintableSalesInvoiceComponent {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private salesService = inject(SalesService);
  private customerService = inject(CustomerService);
  private printService = inject(PrintService);
  private companyService = inject(CompanyService);
  private currentSettingService = inject(CurrentSettingService);
  private qrCodeService = inject(QrCodeService);
  private qrCodeConfigurationService = inject(QrCodeConfigurationService);

  invoice = signal<SalesInvoice | null>(null);
  customer = signal<Customer | null>(null);
  company = signal<Company | null>(null);

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
  }

  async printInvoice(): Promise<void> {
    const inv = this.invoice();
    const customer = this.customer();
    if (!inv || !customer) return;

    const qrImageHtml = await this.buildQrImageHtml();
    const htmlContent = this.generateInvoiceHtml(inv, customer, qrImageHtml);
    this.printService.print(htmlContent);
  }

  /** Pre-generates the QR as a data-URL <img> string for the print-string HTML path --
   * generateInvoiceHtml() builds a raw string (not a live Angular render), so the same
   * QrCodeService logic used by <app-qr-code> in the live view is invoked directly here rather
   * than duplicated. Falls back to no QR section if disabled or context isn't ready yet. */
  private async buildQrImageHtml(): Promise<string> {
    const context = this.qrContext();
    if (!context) return '';

    try {
      const config = await this.qrCodeConfigurationService.getByCompany(this.currentSettingService.getCompanyId()).toPromise();
      if (!config || !config.isEnabled) return '';

      const dataUrl = await this.qrCodeService.generateQrDataUrl(context, config);
      const borderStyle = config.showBorder ? `border: 1px solid ${config.borderColor};` : '';
      const captionHtml = config.caption ? `<div style="font-size:11px;text-align:center;margin-top:4px;">${config.caption}</div>` : '';
      return `
        <div class="qr-code-section">
          <img src="${dataUrl}" alt="QR Code" class="qr-code" style="width:${config.sizePx}px;height:${config.sizePx}px;padding:${config.marginPx}px;${borderStyle}">
          ${captionHtml}
        </div>
      `;
    } catch (error) {
      console.error('Error generating QR code for print:', error);
      return '';
    }
  }

  private generateInvoiceHtml(inv: SalesInvoice, customer: Customer, qrImageHtml: string): string {
    const isPaid = inv.status === 'Paid';
    const transferStatusText = this.transferStatusText();

    const itemsTable = inv.items.map((item, idx) => `
      <tr>
        <td class="col-number">${idx + 1}</td>
        <td class="col-description">${item.carDescription}</td>
        <td class="col-quantity text-center">${item.quantity}</td>
        <td class="col-price text-right">${item.unitPrice.toFixed(2)} SAR</td>
        <td class="col-tax text-right">${(item.unitPrice * 0.15).toFixed(2)} SAR</td>
        <td class="col-total text-right">${item.unitPrice.toFixed(2)} SAR</td>
        <td class="col-line-total text-right font-semibold">${item.lineTotal.toFixed(2)} SAR</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة ضريبية</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            direction: rtl;
            background-color: #f5f5f5;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            width: 100%;
          }
          .company-logo img {
            width: 80px;
            height: 80px;
          }
          .company-details h1 {
            margin: 0;
            color: #333;
            font-size: 24px;
          }
          .company-details p {
            margin: 5px 0;
            color: #666;
          }
          .invoice-title-section {
            text-align: center;
            margin-bottom: 30px;
          }
          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          .invoice-subtitle {
            font-size: 18px;
            color: #666;
            margin: 10px 0;
          }
          .invoice-ref {
            font-size: 16px;
            color: #333;
            margin: 10px 0;
          }
          .invoice-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          .customer-section {
            margin-bottom: 30px;
            background: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .customer-details p {
            margin: 8px 0;
            color: #555;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
          }
          .items-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
          }
          .col-number { width: 5%; }
          .col-description { width: 30%; }
          .col-quantity { width: 10%; }
          .col-price, .col-tax, .col-total, .col-line-total { width: 15%; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-semibold { font-weight: 600; }
          .summary-table {
            width: 300px;
            margin-left: auto;
            border-collapse: collapse;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .summary-row.total-row {
            border-top: 2px solid #333;
            font-weight: bold;
            font-size: 16px;
          }
          .summary-label {
            font-weight: bold;
            color: #333;
          }
          .summary-value {
            color: #666;
          }
          .highlight {
            background-color: #fff3cd;
          }
          .qr-code-section {
            text-align: center;
            margin: 30px 0;
          }
          .qr-code {
            width: 150px;
            height: 150px;
            border: 1px solid #ddd;
          }
          .invoice-footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
          }
          .footer-text {
            margin-bottom: 10px;
          }
          .footer-disclaimer {
            font-size: 12px;
            color: #999;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .invoice-container {
              box-shadow: none;
              padding: 15px;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header Section -->
          <div class="invoice-header">
            <div class="header-top">
              <div class="company-logo">
                <img src="/assets/logo.png" alt="Company Logo" class="logo">
              </div>
              <div class="company-details">
                <h1 class="company-name">${this.companyInfo().name}</h1>
                <p class="company-address">${this.companyInfo().address}</p>
                <p class="company-tax">الرقم الضريبي: ${this.companyInfo().taxNumber}</p>
                <p class="company-phone">الهاتف: ${this.companyInfo().phone}</p>
              </div>
            </div>
          </div>

          <!-- Invoice Title Section -->
          <div class="invoice-title-section">
            <h2 class="invoice-title">فاتورة ضريبية</h2>
            <p class="invoice-subtitle">مبيعات نقدية</p>
            <p class="invoice-ref">رقم الفاتورة: ${inv.invoiceNumber}</p>
          </div>

          <!-- Invoice Info Section -->
          <div class="invoice-info-grid">
            <div class="info-row">
              <span class="info-label">تاريخ الفاتورة:</span>
              <span class="info-value">${new Date(inv.invoiceDate).toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              <span class="info-label" style="margin-right: 40px;">طريقة الدفع:</span>
              <span class="info-value">${inv.paymentMethod}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الرقم الضريبي:</span>
              <span class="info-value">${this.companyInfo().taxNumber}</span>
              <span class="info-label" style="margin-right: 40px;">الموقع:</span>
              <span class="info-value">-</span>
            </div>
          </div>

          <!-- Customer Info Section -->
          <div class="customer-section">
            <h3 class="section-title">معلومات العميل</h3>
            <div class="customer-details">
              <p><strong>اسم العميل:</strong> ${customer.name}</p>
              <p><strong>رقم الهوية:</strong> ${customer.nationalId}</p>
              <p><strong>الهاتف:</strong> ${customer.phone}</p>
              <p><strong>البريد الإلكتروني:</strong> ${customer.email}</p>
              <p><strong>العنوان:</strong> ${customer.address}</p>
            </div>
          </div>

          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-number">#</th>
                <th class="col-description">الأصناف</th>
                <th class="col-quantity">الكمية</th>
                <th class="col-price">سعر الوحدة</th>
                <th class="col-tax">ض.ق.م</th>
                <th class="col-total">سعر الوحدة</th>
                <th class="col-line-total">الإجمالي مع الضريبة</th>
              </tr>
            </thead>
            <tbody>
              ${itemsTable}
            </tbody>
          </table>

          <!-- Summary Section -->
          <div class="summary-table">
            <div class="summary-row">
              <span class="summary-label">عدد الأصناف</span>
              <span class="summary-value">${inv.items.length}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">إجمالي الخاضع للضريبة</span>
              <span class="summary-value">${inv.subtotal.toFixed(2)} SAR</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">ضرائب أخرى</span>
              <span class="summary-value">0.00</span>
            </div>
            <div class="summary-row highlight">
              <span class="summary-label">نسبة الضريبة</span>
              <span class="summary-value">${inv.vatAmount.toFixed(2)} SAR</span>
            </div>
            <div class="summary-row total-row">
              <span class="summary-label">الإجمالي مع الضريبة</span>
              <span class="summary-value">${inv.totalAmount.toFixed(2)} SAR</span>
            </div>
          </div>

          <!-- QR Code Section -->
          ${qrImageHtml}

          <!-- Footer -->
          <div class="invoice-footer">
            <p class="footer-text">شكراً لتعاملكم معنا</p>
            <p class="footer-disclaimer">هذه الفاتورة صادرة عن نظام إلكتروني ولا تحتاج إلى توقيع</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  goBack(): void {
    this.location.back();
  }
}