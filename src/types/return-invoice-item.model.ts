export interface ReturnInvoiceItem {
  carId: number;
  carDescription: string;
  unitPrice: number;
  originalQuantity: number;
  returnQuantity: number;
  lineTotal: number;
}
