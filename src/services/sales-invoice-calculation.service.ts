import { Injectable } from '@angular/core';
import {
  DiscountType,
  SalesInvoiceFinancials,
  SalesInvoiceFinancialsInput,
  calculateDiscountAmount,
  calculateLineTotal,
  calculateSalesInvoiceFinancials,
  calculateSubtotal,
  calculateVatAmount,
  isDiscountValid,
  resolveVatRate,
} from '../models/sales-invoice-financials';

/**
 * Single reusable entry point for every sales-invoice money calculation: line total -> subtotal ->
 * discount -> VAT -> grand total -> payments -> remaining balance. Both the create/edit form (live
 * preview while editing) and the printable invoice (recomputed from the saved record) go through
 * this service instead of each keeping their own copy of the formulas, so the two can never drift
 * into showing inconsistent figures for the same invoice.
 */
@Injectable({ providedIn: 'root' })
export class SalesInvoiceCalculationService {
  calculateLineTotal(quantity: number, unitPrice: number): number {
    return calculateLineTotal(quantity, unitPrice);
  }

  calculateSubtotal(items: { lineTotal: number }[]): number {
    return calculateSubtotal(items);
  }

  isDiscountValid(subtotal: number, discountType: DiscountType | undefined, discountValue: number | undefined): boolean {
    return isDiscountValid(subtotal, discountType, discountValue);
  }

  calculateDiscountAmount(subtotal: number, discountType: DiscountType | undefined, discountValue: number | undefined): number {
    return calculateDiscountAmount(subtotal, discountType, discountValue);
  }

  resolveVatRate(classificationVatRate: number | null | undefined, invoiceType: string | null | undefined): number {
    return resolveVatRate(classificationVatRate, invoiceType);
  }

  calculateVatAmount(amountAfterDiscount: number, vatRate: number | undefined): number {
    return calculateVatAmount(amountAfterDiscount, vatRate);
  }

  calculateFinancials(input: SalesInvoiceFinancialsInput): SalesInvoiceFinancials {
    return calculateSalesInvoiceFinancials(input);
  }
}
