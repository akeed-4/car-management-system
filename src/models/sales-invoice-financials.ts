export type DiscountType = 'Fixed' | 'Percentage';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Single formula for a line's total -- every place that adds/edits an invoice line (grid cell
 * edits, the car-selection dialogs, quotation import, preparation charges) must go through this
 * instead of repeating `quantity * price` inline, so there is exactly one place that can be wrong. */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return round2(Math.max(0, quantity || 0) * Math.max(0, unitPrice || 0));
}

/** Sums already-calculated line totals into the invoice subtotal (before discount). */
export function calculateSubtotal(items: { lineTotal: number }[]): number {
  return round2(items.reduce((sum, item) => sum + (item.lineTotal || 0), 0));
}

/** True when the entered discount is still within range for the given subtotal: a Percentage
 * discount can't exceed 100%, a Fixed discount can't exceed the subtotal itself. */
export function isDiscountValid(subtotal: number, discountType: DiscountType | undefined, discountValue: number | undefined): boolean {
  const value = Math.max(0, discountValue || 0);
  if (discountType === 'Percentage') {
    return value <= 100;
  }
  return value <= Math.max(0, subtotal || 0);
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: DiscountType | undefined,
  discountValue: number | undefined
): number {
  const safeSubtotal = Math.max(0, subtotal || 0);
  const value = Math.max(0, discountValue || 0);
  if (discountType === 'Percentage') {
    return round2(safeSubtotal * (Math.min(value, 100) / 100));
  }
  return round2(Math.min(value, safeSubtotal));
}

/** Classification's own vatRate wins when set (matches purchase-invoice's classification-driven
 * VAT); otherwise fall back to the Taxable/Zero-Rated/Exempt invoiceType selector. */
export function resolveVatRate(
  classificationVatRate: number | null | undefined,
  invoiceType: string | null | undefined
): number {
  if (classificationVatRate !== null && classificationVatRate !== undefined) {
    return classificationVatRate;
  }
  return invoiceType === 'Taxable' ? 15 : 0;
}

export function calculateVatAmount(amountAfterDiscount: number, vatRate: number | undefined): number {
  return round2(Math.max(0, amountAfterDiscount) * ((vatRate || 0) / 100));
}

export interface VatLineInput {
  /** Fixed, VAT-inclusive amount the customer is charged for this line (unitPrice * quantity). */
  grossAmount: number;
  /** Car.calculateVATFromProfitMargin for this line's vehicle. */
  useMarginScheme: boolean;
  /** The car's landed cost (Car.totalCost), scaled to this line's quantity. Ignored unless useMarginScheme. */
  priorCost: number;
  vatRatePercent: number;
}

export interface VatLineResult {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  marginWasNonPositive: boolean;
}

/**
 * Preview-only mirror of the backend's VatCalculationService.CalculateFromGrossAmount -- the
 * saved invoice's persisted vatRate/vatAmount from the backend remain authoritative; this exists
 * so the sales-invoice form can show a live per-line VAT breakdown (standard vs. profit-margin)
 * before save without duplicating the backend as the source of truth. Splits a fixed, VAT-inclusive
 * gross amount into subtotal + VAT: the standard back-out (subtotal = gross / (1 + rate)) or the
 * ZATCA used-goods profit-margin scheme (VAT charged only on the margin above priorCost, with the
 * margin itself treated as VAT-inclusive).
 */
export function calculateLineVat(input: VatLineInput): VatLineResult {
  const grossAmount = Math.max(0, input.grossAmount || 0);
  const rate = Math.max(0, input.vatRatePercent || 0) / 100;

  if (!input.useMarginScheme) {
    const subtotal = rate > 0 ? round2(grossAmount / (1 + rate)) : grossAmount;
    const vatAmount = round2(grossAmount - subtotal);
    return { subtotal, vatAmount, totalAmount: grossAmount, marginWasNonPositive: false };
  }

  const margin = grossAmount - Math.max(0, input.priorCost || 0);
  if (margin <= 0) {
    return { subtotal: grossAmount, vatAmount: 0, totalAmount: grossAmount, marginWasNonPositive: true };
  }

  const vatAmount = round2((margin * rate) / (1 + rate));
  const subtotal = round2(grossAmount - vatAmount);
  return { subtotal, vatAmount, totalAmount: grossAmount, marginWasNonPositive: false };
}

export interface SalesInvoiceFinancialsInput {
  subtotal: number;
  discountType?: DiscountType;
  discountValue?: number;
  vatRate?: number;
  previousPayments?: number;
  currentPayment?: number;
}

export interface SalesInvoiceFinancials {
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  amountAfterDiscount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  previousPayments: number;
  currentPayment: number;
  amountPaid: number;
  remainingBalance: number;
}

/**
 * Single source of truth for the sales-invoice money breakdown (subtotal -> discount -> VAT ->
 * total -> payments -> remaining balance). Used by both the create/edit form (live preview before
 * save) and the printable invoice (recomputed from the saved record), so the two screens can
 * never drift into showing inconsistent figures for the same invoice.
 */
export function calculateSalesInvoiceFinancials(input: SalesInvoiceFinancialsInput): SalesInvoiceFinancials {
  const subtotal = Math.max(0, input.subtotal || 0);
  const discountType: DiscountType = input.discountType === 'Percentage' ? 'Percentage' : 'Fixed';
  const discountValue = Math.max(0, input.discountValue || 0);
  const discountAmount = calculateDiscountAmount(subtotal, discountType, discountValue);
  const amountAfterDiscount = round2(subtotal - discountAmount);
  const vatRate = input.vatRate ?? 0;
  const vatAmount = calculateVatAmount(amountAfterDiscount, vatRate);
  const totalAmount = round2(amountAfterDiscount + vatAmount);
  const previousPayments = Math.max(0, input.previousPayments || 0);
  const currentPayment = Math.max(0, input.currentPayment || 0);
  const amountPaid = Math.min(totalAmount, round2(previousPayments + currentPayment));
  const remainingBalance = Math.max(0, round2(totalAmount - amountPaid));

  return {
    subtotal,
    discountType,
    discountValue,
    discountAmount,
    amountAfterDiscount,
    vatRate,
    vatAmount,
    totalAmount,
    previousPayments,
    currentPayment,
    amountPaid,
    remainingBalance,
  };
}
