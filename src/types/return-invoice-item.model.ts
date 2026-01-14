export interface ReturnInvoiceItem {
  quantity: any;
  carId: number;
  carDescription: string;
  unitPrice: number;
  salesPrice?: number;
  originalQuantity: number;
  returnQuantity: number;
  lineTotal: number;
}
