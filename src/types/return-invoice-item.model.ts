export interface ReturnInvoiceItem {
  carId: number;
  carDescription: string;
  unitPrice: number;
  salePrice?: number;
  originalQuantity: number;
  returnQuantity: number;
  lineTotal: number;
}
