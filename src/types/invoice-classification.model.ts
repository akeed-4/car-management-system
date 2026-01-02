export interface InvoiceClassification {
  id: number;
  code: string; // TAX, SIMPLE
  nameAr: string; // ضريبية، مبسطة
  nameEn: string; // Taxable, Simple
  vatRate: number; // VAT rate percentage
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceClassificationOption {
  value: number;
  label: string;
  vatRate: number;
}