import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SalesService } from './sales.service';
import { PurchasesService } from './purchases.service';
import { ServiceInvoiceService } from './service-invoice.service';
import { CustomerService } from './customer.service';
import { SupplierService } from './supplier.service';
import { CompanyService } from './company.service';
import { CurrentSettingService } from './current-setting.service';
import { SalesInvoiceCalculationService } from './sales-invoice-calculation.service';
import { SettingService } from './setting.service';
import { PurchaseAdditionalCostService } from './purchase-additional-cost.service';
import { Company } from '../models/branch.model';
import { SalesInvoice } from '../models/sales-invoice.model';
import { PurchaseInvoice } from '../models/purchase-invoice.model';
import { ServiceInvoice } from '../models/service-invoice.model';
import { printSettingVm } from '../models/setting.model';
import { PurchaseAdditionalCost } from '../models/purchase-additional-cost.model';
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
  private settingService = inject(SettingService);
  private purchaseAdditionalCostService = inject(PurchaseAdditionalCostService);

  private static readonly CURRENCY = 'SAR';

  /** Loads the invoice of `type` with `id`, plus its party + company + print-setting (logo)
   *  records, and maps everything onto the normalized InvoicePrintData shape. */
  load(type: InvoiceType, id: number, options: { isCopy?: boolean } = {}): Observable<InvoicePrintData | null> {
    const company$ = this.companyService
      .getById(this.currentSettingService.getCompanyId())
      .pipe(catchError(() => of<Company | null>(null)));

    // menuCode: null -- the header logo/printInstitutionLogo toggle is a global print setting,
    // not scoped to a specific report menu.
    const printSetting$ = this.settingService.getPrintSetting(null)
      .pipe(catchError(() => of<printSettingVm | null>(null)));

    return forkJoin({
      company: company$,
      printSetting: printSetting$,
      invoice: this.loadInvoice(type, id),
    }).pipe(
      switchMap(({ company, printSetting, invoice }) => {
        if (!invoice) return of(null);
        const data = this.normalize(type, invoice, company, printSetting, options);
        // mapSales/mapPurchase/mapService only have the invoice DTO's denormalized party id +
        // name string to work with (e.g. PurchaseInvoiceDto.SupplierId/SupplierName -- there is
        // no nested Supplier/Customer object on the wire), so `party` above only ever gets a
        // name. Fetch the real supplier/customer record here and patch the rest of the party
        // block (tax id, CR number, phone, email, address) onto it -- same "load once, patch
        // data afterward" pattern the purchase additional-cost totals switchMap below already
        // uses for `data.totals`. Falls back to whatever normalize() already set (never worse
        // than before) when the party has no linked id or the fetch fails.
        return this.loadPartyDetails(type, invoice).pipe(
          map(party => (party ? { ...data, party: { ...data.party, ...party } } : data)),
        );
      }),
      switchMap(data => {
        // Purchase invoices only: fetch real Customs/Shipping/Freight/Additional-Expenses amounts
        // for this invoice and fold them into totals. A separate call (no GetByPurchaseInvoiceId
        // endpoint exists) rather than blocking the main forkJoin above on an unrelated document.
        if (!data || type !== 'purchase') return of(data);
        return this.loadPurchaseAdditionalCostTotals(id).pipe(
          map(extra => ({ ...data, totals: { ...data.totals, ...extra } })),
          catchError(() => of(data)),
        );
      }),
      catchError(() => of(null)),
    );
  }

  /** Sums this purchase invoice's posted-or-draft PurchaseAdditionalCost documents by category:
   *  Customs -> customs, Shipping+Freight -> shippingAndFreight, everything else -> additionalExpenses.
   *  Returns an empty object (no keys set, so the template hides the rows) when the invoice has no
   *  additional-cost documents at all -- getAll() has no invoice filter, so this is the only way to
   *  scope it without a new backend endpoint. */
  private loadPurchaseAdditionalCostTotals(purchaseInvoiceId: number): Observable<Partial<InvoicePrintTotals>> {
    return this.purchaseAdditionalCostService.getAll().pipe(
      map(res => {
        const costs = (res?.data ?? []).filter((c: PurchaseAdditionalCost) => c.purchaseInvoiceId === purchaseInvoiceId);
        if (costs.length === 0) return {};

        const sumBy = (predicate: (c: PurchaseAdditionalCost) => boolean) =>
          costs.filter(predicate).reduce((sum, c) => sum + (c.amount || 0), 0);

        const customs = sumBy(c => c.expenseCategory === 'Customs');
        const shippingAndFreight = sumBy(c => c.expenseCategory === 'Shipping' || c.expenseCategory === 'Freight');
        const additionalExpenses = sumBy(c => c.expenseCategory !== 'Customs' && c.expenseCategory !== 'Shipping' && c.expenseCategory !== 'Freight');

        const extra: Partial<InvoicePrintTotals> = {};
        if (customs > 0) extra.customs = customs;
        if (shippingAndFreight > 0) extra.shippingAndFreight = shippingAndFreight;
        if (additionalExpenses > 0) extra.additionalExpenses = additionalExpenses;
        return extra;
      }),
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

  /** Real supplier/customer record for the party section -- see load()'s doc comment for why
   *  this is a separate fetch. Returns only the fields to merge in (never a full InvoicePrintParty),
   *  and null when there's no linked id (e.g. a sales invoice with no CustomerId) or the fetch
   *  fails, so the caller's merge is a safe no-op in either case. */
  private loadPartyDetails(
    type: InvoiceType,
    invoice: SalesInvoice | PurchaseInvoice | ServiceInvoice,
  ): Observable<Partial<InvoicePrintParty> | null> {
    if (type === 'purchase') {
      const supplierId = (invoice as PurchaseInvoice).supplierId;
      if (!supplierId) return of(null);
      return this.supplierService.getSupplierById(supplierId).pipe(
        map(supplier => ({
          name: supplier.name,
          taxId: supplier.taxNumber,
          crNumber: supplier.crNumber,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
        })),
        catchError(() => of(null)),
      );
    }

    const customerId = (invoice as SalesInvoice | ServiceInvoice).customerId;
    if (!customerId) return of(null);
    return from(this.customerService.getCustomerById(customerId)).pipe(
      map(customer => ({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
      })),
      catchError(() => of(null)),
    );
  }

  // ------------------------------------------------------------------ mapping

  private normalize(
    type: InvoiceType,
    invoice: SalesInvoice | PurchaseInvoice | ServiceInvoice,
    company: Company | null,
    printSetting: printSettingVm | null,
    options: { isCopy?: boolean },
  ): InvoicePrintData {
    const base = {
      type,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      currency: InvoicePrintDataService.CURRENCY,
      company: this.mapCompany(company, printSetting),
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

  private mapCompany(company: Company | null, printSetting: printSettingVm | null): InvoicePrintParty {
    // Logo is independent of whether the Company record itself loaded -- ReportPrintSettings is a
    // separate, always-available concept -- so it's read even when company is null.
    const logoUrl = printSetting?.printInstitutionLogo && printSetting?.logo ? printSetting.logo : undefined;
    if (!company) return { name: '', logoUrl };
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
      logoUrl,
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
      // Purchase invoices have no discount concept in the model (totalDiscount is always 0 above)
      // -- "Amount Before Tax" therefore equals "Amount Before Discount" exactly, same as Sales
      // Invoice reduces to when its own discount is 0.
      amountAfterDiscount: taxableAmount,
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
        // PurchaseInvoiceDto never carries a nested Supplier object (inv.supplier is always
        // undefined at runtime) -- only the denormalized SupplierName string. Real name +
        // tax id/CR number/phone/email/address come from loadPartyDetails' supplier fetch,
        // which patches over this; supplierName is just the synchronous fallback if that fetch
        // fails.
        name: inv.supplierName ?? '',
        poReference: (inv as any).poReference ?? (inv as any).purchaseOrderNumber,
      },
      items,
      totals,
      metaCells,
      paymentTerms: [],
      auction,
      qr: this.buildQr(inv.supplierName, undefined, undefined,
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