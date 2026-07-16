import { QrCodeContext } from './qr-code.model';

/**
 * Universal print model every shared print-engine component renders generically. No component
 * in src/components/shared/print-document/ ever touches a document's native DTO -- each document
 * type supplies one small adapter function (e.g. mapGrnToPrintModel) that builds this shape
 * instead. That adapter function IS the "report configuration" for that document type; adding a
 * new printable document means writing one adapter, not touching any shared component.
 */
export interface PrintDocumentModel {
  documentTypeLabel: string;
  documentNumber: string;
  /** Free-form status label (works for both DocumentStatus and PoStatus, or any future enum) --
   * color is resolved by the caller's adapter so unrelated enums never need reconciling. */
  status?: { label: string; color: string };

  issueDate: Date;
  postingDate?: Date;
  dueDate?: Date;
  referenceNumber?: string;
  branch?: string;
  warehouse?: string;
  store?: string;
  currency: string;
  exchangeRate?: number;
  salesperson?: string;
  createdBy?: string;
  approvedBy?: string;
  approvedDate?: Date;

  company: PrintPartyInfo;
  /** Customer or supplier, already normalized. Omitted entirely by print-party-section when undefined
   * -- not every document type (e.g. a pure internal stock adjustment) has a counterparty. */
  party?: PrintPartyInfo;

  items: PrintLineItem[];
  /** Ordered subset of PRINT_COLUMN_REGISTRY keys this document wants rendered -- the actual
   * "config" behind the generic grid. */
  columns: PrintColumnKey[];

  totals: PrintTotals;
  payment?: PrintPaymentInfo;
  signatures?: PrintSignatureBlock[];

  footerMeta: {
    printedBy: string;
    printedAt: Date;
    documentVersion?: string;
    confidential?: boolean;
  };

  /** Reuses today's QrCodeContext as-is -- the print engine embeds the existing <app-qr-code>
   * component rather than rebuilding QR logic. */
  qrContext?: QrCodeContext;
}

/** Normalized party shape every adapter maps its own Supplier/Customer/Company/Branch/Store
 * object into -- resolves the field-name/shape inconsistency between those types in one place. */
export interface PrintPartyInfo {
  name: string;
  code?: string;
  vatNumber?: string;
  crNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

/** One flat row shape for every document's line items. All fields optional; the document's
 * `columns` list controls which ones actually render -- no per-document item interface needed. */
export interface PrintLineItem {
  code?: string;
  barcode?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  unit?: string;
  quantity?: number;
  freeQuantity?: number;
  price?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  netAmount?: number;
  warehouse?: string;
  location?: string;
  batch?: string;
  serialNumber?: string;
  vin?: string;
  engineNumber?: string;
  chassisNumber?: string;
  color?: string;
  model?: string;
  year?: string;
  remarks?: string;
  /** Escape hatch for a column the registry doesn't cover yet, keyed by column id. */
  extra?: Record<string, string>;
}

export interface PrintTotals {
  subtotal: number;
  discount?: number;
  additionalDiscount?: number;
  tax?: number;
  shipping?: number;
  insurance?: number;
  fees?: number;
  roundAdjustment?: number;
  grandTotal: number;
  paid?: number;
  remaining?: number;
  currency: string;
}

export interface PrintPaymentInfo {
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Cheque' | 'Installments' | 'POS';
  reference?: string;
  amount?: number;
  notes?: string;
}

export interface PrintSignatureBlock {
  labelKey: string;
  name?: string;
  date?: Date;
  imageUrl?: string;
}

/** Registry keys -- one entry per reusable column, added once, available to every document. */
export type PrintColumnKey =
  | 'code' | 'barcode' | 'description' | 'descriptionAr' | 'descriptionEn' | 'unit'
  | 'quantity' | 'freeQuantity' | 'price' | 'discountPercent' | 'discountAmount'
  | 'taxPercent' | 'taxAmount' | 'netAmount' | 'warehouse' | 'location' | 'batch'
  | 'serialNumber' | 'vin' | 'engineNumber' | 'chassisNumber' | 'color' | 'model'
  | 'year' | 'remarks';

export interface PrintColumnDefinition {
  labelKey: string;
  align: 'left' | 'right' | 'center';
  formatter: (item: PrintLineItem) => string;
}

function numberFormatter(value: number | undefined, decimals = 2): string {
  if (value === undefined || value === null) return '';
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Shared, reusable column-definition registry (Decision 3) -- each document's adapter picks an
 * ordered subset of these keys via PrintDocumentModel.columns. New columns are added here once
 * and become available to every document immediately, instead of every document re-implementing
 * its own quantity/price/tax formatting. */
export const PRINT_COLUMN_REGISTRY: Record<PrintColumnKey, PrintColumnDefinition> = {
  code: { labelKey: 'PRINT_DOCUMENT.COL_CODE', align: 'left', formatter: (i) => i.code ?? '' },
  barcode: { labelKey: 'PRINT_DOCUMENT.COL_BARCODE', align: 'left', formatter: (i) => i.barcode ?? '' },
  description: { labelKey: 'PRINT_DOCUMENT.COL_DESCRIPTION', align: 'right', formatter: (i) => i.description ?? '' },
  descriptionAr: { labelKey: 'PRINT_DOCUMENT.COL_DESCRIPTION_AR', align: 'right', formatter: (i) => i.descriptionAr ?? '' },
  descriptionEn: { labelKey: 'PRINT_DOCUMENT.COL_DESCRIPTION_EN', align: 'left', formatter: (i) => i.descriptionEn ?? '' },
  unit: { labelKey: 'PRINT_DOCUMENT.COL_UNIT', align: 'center', formatter: (i) => i.unit ?? '' },
  quantity: { labelKey: 'PRINT_DOCUMENT.COL_QUANTITY', align: 'center', formatter: (i) => numberFormatter(i.quantity, 0) },
  freeQuantity: { labelKey: 'PRINT_DOCUMENT.COL_FREE_QUANTITY', align: 'center', formatter: (i) => numberFormatter(i.freeQuantity, 0) },
  price: { labelKey: 'PRINT_DOCUMENT.COL_PRICE', align: 'right', formatter: (i) => numberFormatter(i.price) },
  discountPercent: { labelKey: 'PRINT_DOCUMENT.COL_DISCOUNT_PERCENT', align: 'right', formatter: (i) => i.discountPercent !== undefined ? `${numberFormatter(i.discountPercent)}%` : '' },
  discountAmount: { labelKey: 'PRINT_DOCUMENT.COL_DISCOUNT_AMOUNT', align: 'right', formatter: (i) => numberFormatter(i.discountAmount) },
  taxPercent: { labelKey: 'PRINT_DOCUMENT.COL_TAX_PERCENT', align: 'right', formatter: (i) => i.taxPercent !== undefined ? `${numberFormatter(i.taxPercent)}%` : '' },
  taxAmount: { labelKey: 'PRINT_DOCUMENT.COL_TAX_AMOUNT', align: 'right', formatter: (i) => numberFormatter(i.taxAmount) },
  netAmount: { labelKey: 'PRINT_DOCUMENT.COL_NET_AMOUNT', align: 'right', formatter: (i) => numberFormatter(i.netAmount) },
  warehouse: { labelKey: 'PRINT_DOCUMENT.COL_WAREHOUSE', align: 'left', formatter: (i) => i.warehouse ?? '' },
  location: { labelKey: 'PRINT_DOCUMENT.COL_LOCATION', align: 'left', formatter: (i) => i.location ?? '' },
  batch: { labelKey: 'PRINT_DOCUMENT.COL_BATCH', align: 'left', formatter: (i) => i.batch ?? '' },
  serialNumber: { labelKey: 'PRINT_DOCUMENT.COL_SERIAL_NUMBER', align: 'left', formatter: (i) => i.serialNumber ?? '' },
  vin: { labelKey: 'PRINT_DOCUMENT.COL_VIN', align: 'left', formatter: (i) => i.vin ?? '' },
  engineNumber: { labelKey: 'PRINT_DOCUMENT.COL_ENGINE_NUMBER', align: 'left', formatter: (i) => i.engineNumber ?? '' },
  chassisNumber: { labelKey: 'PRINT_DOCUMENT.COL_CHASSIS_NUMBER', align: 'left', formatter: (i) => i.chassisNumber ?? '' },
  color: { labelKey: 'PRINT_DOCUMENT.COL_COLOR', align: 'center', formatter: (i) => i.color ?? '' },
  model: { labelKey: 'PRINT_DOCUMENT.COL_MODEL', align: 'left', formatter: (i) => i.model ?? '' },
  year: { labelKey: 'PRINT_DOCUMENT.COL_YEAR', align: 'center', formatter: (i) => i.year ?? '' },
  remarks: { labelKey: 'PRINT_DOCUMENT.COL_REMARKS', align: 'right', formatter: (i) => i.remarks ?? '' }
};
