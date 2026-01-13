export interface ReturnInvoiceItem {
  quantity: any;
  salesPrice: number;
  carId: number;
  carDescription: string;
  unitPrice: number;
  salePrice?: number;
  originalQuantity: number;
  returnQuantity: number;
  lineTotal: number;
}
