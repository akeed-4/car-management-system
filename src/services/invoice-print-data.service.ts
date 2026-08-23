import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalesService } from './sales.service';
import { PurchasesService } from './purchases.service';
import { ServiceInvoiceService } from './service-invoice.service';
import { CustomerService } from './customer.service';
import { SupplierService } from './supplier.service';
import { CompanyService } from './company.service';
import { CurrentSettingService } from './current-setting.service';
import { SalesInvoiceCalculationService } from './sales-invoice-calculation.service';
import { Company } from '../models/branch.model';
import { SalesInvoice } from '../models/sales-invoice.model';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { ServiceInvoice } from '../models/service-invoice.model';
import {
  InvoicePrintData,
  InvoicePrintParty,
  InvoicePrintLineItem,
  InvoicePrintTotals,
  InvoiceType,
  InvoiceWatermark,
} from '../models/invoice-print.model';
import { QrCodeContext } from '../models/qr-code.model';

/**
 * ============================================================================
 * INVOICE PRINT — DATA LAYER
 * ============================================================================
 * Single entry point the template layer uses to load ANY invoice type as a
 * normalized InvoicePrintData document. Owns all per-type mapping logic
 * (field names, VAT back-out estimates, watermark resolution, QR context)
 * so the template and export layers stay type-agnostic.
 */
@Injectable({ providedIn: 'root' })
export class InvoicePrintDataService {
  private salesService = inject(SalesService);
  private purchasesService = inject(PurchasesService);
  private serviceInvoiceService = inject(ServiceInvoiceService);
  private customerService = inject(CustomerService);
  private supplierService = inject(SupplierService);
  private companyService = inject(CompanyService);
  private currentSettingService = inject(CurrentSettingService);
  private calc = inject(SalesInvoiceCalculationService);

  private static readonly CURRENCY = 'SAR';

  /** Loads the invoice of `type` with `id`, plus its party + company records,
   *  and maps everything onto the normalized InvoicePrintData shape. */
  load(type: InvoiceType, id: number, options: { isCopy?: boolean } = {}): Observable<InvoicePrintData | null> {
    const company$ = this.companyService
      .getById(this.currentSettingService.getCompanyId())
      .pipe(catchError(() => of<Company | null>(null)));

    return forkJoin({
      company: company$,
      invoice: this.loadInvoice(type, id),
    }).pipe(
      map(({ company, invoice }) => {
        if (!invoice) return null;
        return this.normalize(type, invoice, company, options);
      }),
      catchError(() => of(null)),
    );
  }

  private loadInvoice(type: InvoiceType, id: number): Observable<SalesInvoice | PurchaseInvoice | ServiceInvoice | null> {
    switch (type) {
      case 'sales':
        return this.salesService.getInvoiceById(id).pipe(catchError(() => of(null)));
      case 'purchase':
        return this.purchasesService.getInvoiceById(id).pipe(catchError(() => of(null)));
      case 'service':
        return this.serviceInvoiceService.getInvoiceById(id).pipe(catchError(() => of(null)));
    }
  }

  // ------------------------------------------------------------------ mapping

  private normalize(
    type: InvoiceType,
    invoice: SalesInvoice | PurchaseInvoice | ServiceInvoice,
    company: Company | null,
    options: { isCopy?: boolean },
  ): InvoicePrintData {
    const base = {
      type,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: InvoicePrintDataService.CURRENCY,
      company: this.mapCompany(company),
      watermark: this.resolveWatermark(type, invoice.status, options.isCopy),
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes,
    };

    switch (type) {
      case 'sales':
        return this.mapSales(base, invoice as SalesInvoice, company);
      case 'purchase':
        return this.mapPurchase(base, invoice as PurchaseInvoice, company);
      case 'service':
        return this.mapService(base, invoice as ServiceInvoice, company);
    }
  }

  private mapCompany(company: Company | null): InvoicePrintParty {
    if (!company) return { name: '' };
    return {
      name: company.nameAr || company.nameEn,
      taxId: company.vatRegistrationNumber,
      crNumber: company.crNumber,
      phone: (company as any).phone,
      email: (company as any).email,
      address: company.address
        ? [company.address.street, company.address.city, company.address.country]
            .filter(Boolean)
            .join(', ')
        : undefined,
    };
  }

  /** Watermark resolution: an explicit `copy` request always wins; otherwise
   *  the invoice's own payment status drives PAID/UNPAID, and service invoices
   *  additionally support DRAFT. */
  private resolveWatermark(type: InvoiceType, status: string, isCopy?: boolean): InvoiceWatermark {
    if (isCopy) return 'COPY';
    if (type === 'service' && status === 'Draft') return 'DRAFT';
    return status === 'Paid' ? 'PAID' : 'UNPAID';
  }

  // ------------------------------------------------------------------- sales

  private mapSales(
    base: Omit<InvoicePrintData, 'party' | 'items' | 'totals' | 'metaCells' | 'paymentTerms' | 'qr'>,
    inv: SalesInvoice,
    company: Company | null,
  ): InvoicePrintData {
    const vatRate = inv.vatRate ?? this.calc.resolveVatRate(null, inv.invoiceType ?? null);
    const discountType = inv.discountType ?? 'Fixed';
    const discountValue = inv.discountValue ?? 0;
    const discountAmount =
      inv.discountAmount ?? this.calc.calculateDiscountAmount(inv.subtotal, discountType, discountValue);
    const amountAfterDiscount = inv.amountAfterDiscount ?? Math.max(0, inv.subtotal - discountAmount);
    const previousPayments = inv.previousPayments ?? 0;
    const downPayment = inv.downPayment ?? 0;
    const currentPayment = inv.currentPayment ?? Math.max(0, inv.amountPaid - previousPayments);

    const items: InvoicePrintLineItem[] = (inv.items ?? []).map(item => ({
      description: item.carDescription,
      detail: item.car?.vin,
      quantity: item.quantity,
      unit: 'item',
      unitPrice: item.unitPrice ?? 0,
      discountPercent: 0, // sales discount is invoice-level (see totals)
      taxPercent: vatRate,
      lineTotal: item.lineTotal,
    }));

    const totals: InvoicePrintTotals = {
      subtotal: inv.subtotal,
      totalDiscount: discountAmount,
      discountLabel: discountType === 'Percentage' ? `${discountValue}%` : undefined,
      totalTax: inv.vatAmount,
      taxRate: vatRate,
      grandTotal: inv.totalAmount,
      amountPaid: inv.amountPaid,
      amountDue: inv.remainingBalance ?? inv.amountDue,
      previousPayments,
      downPayment,
      currentPayment,
      amountAfterDiscount,
    };

    const metaCells = [
      inv.salesperson ? { label: 'INVOICE_PRINT.META.SALESPERSON', value: inv.salesperson } : null,
      inv.invoiceType ? { label: 'INVOICE_PRINT.META.INVOICE_TYPE', value: inv.invoiceType } : null,
      inv.quotationNumber ? { label: 'INVOICE_PRINT.META.QUOTATION', value: inv.quotationNumber } : null,
    ].filter(Boolean) as InvoicePrintData['metaCells'];

    return {
      ...base,
      party: {
        name: inv.customerName,
        phone: undefined,
        email: undefined,
      },
      items,
      totals,
      metaCells,
      paymentTerms: [],
      qr: this.buildQr(company?.nameAr || company?.nameEn, company?.vatRegistrationNumber, company?.crNumber,
        inv.invoiceNumber, inv.invoiceDate, inv.customerName, undefined, amountAfterDiscount, inv.vatAmount, inv.totalAmount),
    };
  }

  // ---------------------------------------------------------------- purchase

  private mapPurchase(
    base: Omit<InvoicePrintData, 'party' | 'items' | 'totals' | 'metaCells' | 'paymentTerms' | 'qr'>,
    inv: PurchaseInvoice,
    company: Company | null,
  ): InvoicePrintData {
    const hasPersistedBreakdown = inv.subtotal != null && inv.vatAmount != null;
    const taxableAmount = hasPersistedBreakdown ? inv.subtotal! : inv.totalAmount / 1.15;
    const vatAmount = hasPersistedBreakdown ? inv.vatAmount! : inv.totalAmount - taxableAmount;
    const rate = taxableAmount > 0 ? Math.round((vatAmount / taxableAmount) * 100) : 0;

    const items: InvoicePrintLineItem[] = (inv.items ?? []).map(item => ({
      description: item.carDescription,
      detail: item.car?.vin,
      quantity: item.quantity,
      unit: 'item',
      unitPrice: item.unitPrice ?? 0,
      discountPercent: 0,
      taxPercent: rate,
      lineTotal: item.lineTotal,
    }));

    const totals: InvoicePrintTotals = {
      subtotal: taxableAmount,
      totalDiscount: 0,
      totalTax: vatAmount,
      taxRate: rate,
      grandTotal: inv.totalAmount,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
    };

    const metaCells = [
      inv.invoiceType ? { label: 'INVOICE_PRINT.META.INVOICE_TYPE', value: inv.invoiceType } : null,
      inv.paymentType ? { label: 'INVOICE_PRINT.META.PAYMENT_TYPE', value: inv.paymentType } : null,
    ].filter(Boolean) as InvoicePrintData['metaCells'];

    const auction = inv.auctionProvider
      ? {
          provider: inv.auctionProvider,
          lotNumber: inv.auctionLotNumber ?? undefined,
          charges: (inv.auctionCharges ?? []).map(c => ({ type: c.chargeType, amount: c.amount })),
          total: inv.auctionChargesTotal ?? 0,
        }
      : undefined;

    return {
      ...base,
      party: {
        name: inv.supplier?.name ?? '',
        taxId: inv.supplier?.taxNumber,
        crNumber: inv.supplier?.crNumber,
        phone: inv.supplier?.phone,
        email: inv.supplier?.email,
        address: inv.supplier?.address,
        poReference: (inv as any).poReference ?? (inv as any).purchaseOrderNumber,
      },
      items,
      totals,
      metaCells,
      paymentTerms: [],
      auction,
      qr: this.buildQr(inv.supplier?.name, inv.supplier?.taxNumber, inv.supplier?.crNumber,
        inv.invoiceNumber, inv.invoiceDate, company?.nameAr || company?.nameEn, company?.vatRegistrationNumber,
        taxableAmount, vatAmount, inv.totalAmount),
    };
  }

  // ----------------------------------------------------------------- service

  private mapService(
    base: Omit<InvoicePrintData, 'party' | 'items' | 'totals' | 'metaCells' | 'paymentTerms' | 'qr'>,
    inv: ServiceInvoice,
    company: Company | null,
  ): InvoicePrintData {
    const vatRate = inv.vatRate ?? 15;

    const items: InvoicePrintLineItem[] = (inv.items ?? []).map(item => ({
      description: item.description,
      quantity: item.hours ?? item.quantity ?? 1,
      unit: item.hours != null ? 'hour' : 'item',
      unitPrice: item.rate ?? 0,
      discountPercent: item.discountPercent ?? 0,
      taxPercent: item.taxPercent ?? vatRate,
      lineTotal: item.lineTotal,
    }));

    const totals: InvoicePrintTotals = {
      subtotal: inv.subtotal,
      totalDiscount: inv.discountAmount ?? 0,
      totalTax: inv.vatAmount,
      taxRate: vatRate,
      grandTotal: inv.totalAmount,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
    };

    const metaCells = [
      inv.poReference ? { label: 'INVOICE_PRINT.META.PO_REFERENCE', value: inv.poReference } : null,
      inv.serviceOrderId ? { label: 'INVOICE_PRINT.META.SERVICE_ORDER', value: `#${inv.serviceOrderId}` } : null,
    ].filter(Boolean) as InvoicePrintData['metaCells'];

    return {
      ...base,
      party: {
        name: inv.customerName ?? '',
        poReference: inv.poReference,
      },
      items,
      totals,
      metaCells,
      paymentTerms: [],
      qr: this.buildQr(company?.nameAr || company?.nameEn, company?.vatRegistrationNumber, company?.crNumber,
        inv.invoiceNumber, inv.invoiceDate, inv.customerName, undefined, inv.subtotal, inv.vatAmount, inv.totalAmount),
    };
  }

  // ---------------------------------------------------------------------- qr

  private buildQr(
    sellerName: string | undefined,
    sellerVat: string | undefined,
    sellerCr: string | undefined,
    documentNumber: string,
    documentDate: string,
    buyerName: string | undefined,
    buyerVat: string | undefined,
    totalBeforeVat: number,
    vatAmount: number,
    grandTotal: number,
  ): QrCodeContext {
    return {
      companyName: sellerName ?? '',
      vatNumber: sellerVat ?? '',
      crNumber: sellerCr,
      documentNumber,
      documentDate: new Date(documentDate),
      customerName: buyerName,
      customerVatNumber: buyerVat,
      currency: InvoicePrintDataService.CURRENCY,
      totalBeforeVat,
      vatAmount,
      grandTotal,
    };
  }
}