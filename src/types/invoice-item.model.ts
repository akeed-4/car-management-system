export interface InvoiceItem {
  carId: number;
  carDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  carImage?: string | null;
}
