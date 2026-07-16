/** Mirrors QrCodeConfiguration's Position values (Domain/Entities/QrCodeConfiguration.cs). */
export type QrPosition = 'TopRight' | 'TopLeft' | 'BottomRight' | 'BottomLeft' | 'Header' | 'Footer';

/** Mirrors Application/DTOs/QrCodeConfigurationDto.cs. */
export interface QrCodeConfigurationDto {
  id: number;
  companyId: number;
  isEnabled: boolean;
  position: QrPosition;
  sizePx: number;
  marginPx: number;
  caption?: string;
  showBorder: boolean;
  borderColor: string;
  foregroundColor: string;
  zatcaModeEnabled: boolean;
  /** JSON-encoded string[] of QrCodeContext field names -- only used when zatcaModeEnabled is false. */
  contentFieldsJson?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateQrCodeConfigurationDto {
  companyId: number;
  isEnabled: boolean;
  position: QrPosition;
  sizePx: number;
  marginPx: number;
  caption?: string;
  showBorder: boolean;
  borderColor: string;
  foregroundColor: string;
  zatcaModeEnabled: boolean;
  contentFieldsJson?: string;
}

export interface UpdateQrCodeConfigurationDto extends CreateQrCodeConfigurationDto {}

/**
 * Typed, extensible payload source every printable document builds once. New fields (digital
 * signature, verification URL, payment link, etc.) go in extraFields so the QR component and
 * print templates never need to change to support them -- only qr-code.service's payload
 * builders need to learn to read a new key.
 */
export interface QrCodeContext {
  companyName: string;
  vatNumber: string;
  crNumber?: string;
  documentNumber: string;
  documentDate: Date;
  customerName?: string;
  customerVatNumber?: string;
  currency: string;
  totalBeforeVat: number;
  vatAmount: number;
  grandTotal: number;
  branchName?: string;
  extraFields?: Record<string, string>;
}

/** Optional field names selectable in non-ZATCA "plain content" mode (ContentFieldsJson). */
export const QR_PLAIN_CONTENT_FIELDS: { value: keyof QrCodeContext; labelKey: string }[] = [
  { value: 'companyName', labelKey: 'QR_CODE.FIELD_COMPANY_NAME' },
  { value: 'vatNumber', labelKey: 'QR_CODE.FIELD_VAT_NUMBER' },
  { value: 'crNumber', labelKey: 'QR_CODE.FIELD_CR_NUMBER' },
  { value: 'documentNumber', labelKey: 'QR_CODE.FIELD_DOCUMENT_NUMBER' },
  { value: 'documentDate', labelKey: 'QR_CODE.FIELD_DOCUMENT_DATE' },
  { value: 'customerName', labelKey: 'QR_CODE.FIELD_CUSTOMER_NAME' },
  { value: 'customerVatNumber', labelKey: 'QR_CODE.FIELD_CUSTOMER_VAT_NUMBER' },
  { value: 'currency', labelKey: 'QR_CODE.FIELD_CURRENCY' },
  { value: 'totalBeforeVat', labelKey: 'QR_CODE.FIELD_TOTAL_BEFORE_VAT' },
  { value: 'vatAmount', labelKey: 'QR_CODE.FIELD_VAT_AMOUNT' },
  { value: 'grandTotal', labelKey: 'QR_CODE.FIELD_GRAND_TOTAL' },
  { value: 'branchName', labelKey: 'QR_CODE.FIELD_BRANCH_NAME' }
];

export const QR_POSITIONS: { value: QrPosition; labelKey: string }[] = [
  { value: 'TopRight', labelKey: 'QR_CODE.POSITION_TOP_RIGHT' },
  { value: 'TopLeft', labelKey: 'QR_CODE.POSITION_TOP_LEFT' },
  { value: 'BottomRight', labelKey: 'QR_CODE.POSITION_BOTTOM_RIGHT' },
  { value: 'BottomLeft', labelKey: 'QR_CODE.POSITION_BOTTOM_LEFT' },
  { value: 'Header', labelKey: 'QR_CODE.POSITION_HEADER' },
  { value: 'Footer', labelKey: 'QR_CODE.POSITION_FOOTER' }
];
