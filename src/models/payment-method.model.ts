export interface PaymentMethod {
  id: number;
  nameAr: string;
  nameEn: string;
  paymentType: string;
  accountId: number;
  accountCode: string;
  accountNameAr: string;
  accountNameEn: string;
  isActive: boolean;
  createdBy?: number | null;
  createdDate: string;
  modifiedBy?: number | null;
  modifiedDate?: string | null;
}

export interface CreatePaymentMethodDto {
  nameAr: string;
  nameEn: string;
  paymentType: string;
  accountId: number;
  isActive: boolean;
}

export interface UpdatePaymentMethodDto extends CreatePaymentMethodDto {}

/** Fixed suggestions offered in the Payment Type dropdown on the Payment Method form -- the
 *  field itself is a free string end-to-end (frontend model, DTO, backend column), matching
 *  PurchaseInvoice.PaymentType's own convention, so a new type never needs a code change. */
export const PAYMENT_METHOD_TYPES: string[] = [
  'Cash',
  'Bank',
  'Card',
  'BankTransfer',
  'Installment',
  'Credit',
  'Other'
];

/** Settlement classification helper (docs/specs/settlement-account-resolution-spec.md §2):
 *  'Credit (Deferred)'/'Credit'/'Installment' (and Arabic آجل/تقسيط labels) are DEFERRED (term)
 *  settlement; every other payment type -- Cash, Bank, Card, BankTransfer, Check, Other, free
 *  text, Arabic نقدي -- settles IMMEDIATELY and is treated as cash-like everywhere the cash/credit
 *  UI branches. Treating only the literal 'Cash' string as cash used to render immediately-settled
 *  Bank/Card/default-'Bank Transfer' documents as credit (Initial Payment section + supplier-AP
 *  account requirement) even though the backend settles them as cash. */
export function isDeferredSettlementType(value: string | null | undefined): boolean {
  const v = (value ?? '').toString().trim().toLowerCase();
  if (!v) return false;
  return v === 'credit' || v === 'credit (deferred)' || v === 'installment' ||
         v.includes('آجل') || v.includes('تقسيط');
}

/** ONE user-facing Payment field rule: the user only ever picks a Payment Method (paymentMethodId)
 *  from the Payment Methods master. The legacy `paymentMethod`/`paymentType` strings that the API
 *  payload (and older documents) still carry are DERIVED from that selection -- never picked
 *  separately. `paymentType` keeps the master method's own type string (Cash/Bank/Check/...);
 *  `paymentMethod` mirrors it for cash and otherwise falls back to the type, so every consumer
 *  (backend settlement resolution, isCashPayment-style branching, print) keeps working unchanged. */
export function deriveLegacyPaymentStrings(method: PaymentMethod | null | undefined): { paymentMethod: string; paymentType: string } {
  const type = (method?.paymentType || '').trim();
  const label = (method?.nameEn || method?.nameAr || '').trim();
  const fallback = type || label || 'Cash';
  return {
    paymentType: fallback,
    paymentMethod: type === 'Cash' ? 'Cash' : fallback
  };
}

/** Legacy compatibility: maps a legacy paymentMethod/paymentType string pair (e.g. from a document
 *  saved before paymentMethodId existed) back to the best-matching Payment Method master row, so
 *  edit forms can prefill the single Payment Method selector. Comparison normalizes case and
 *  separators so 'BANK_TRANSFER' matches a 'Bank Transfer'/'BankTransfer' master row. */
export function matchLegacyPaymentMethodId(
  methods: PaymentMethod[] | null | undefined,
  legacy: { paymentMethod?: string | null; paymentType?: string | null } | null | undefined
): number | null {
  if (!methods?.length || !legacy) return null;
  const normalize = (v: string | null | undefined): string => (v || '').trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '');
  const pm = normalize(legacy.paymentMethod);
  const pt = normalize(legacy.paymentType);
  if (!pm && !pt) return null;
  const match = methods.find(m => {
    const t = normalize(m.paymentType);
    const en = normalize(m.nameEn);
    const ar = normalize(m.nameAr);
    return (!!pt && (t === pt || en === pt || ar === pt)) ||
           (!!pm && (en === pm || ar === pm || t === pm));
  });
  return match?.id ?? null;
}
