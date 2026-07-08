
export interface InvoiceItem {
  id?: number;
  returnQuantity?: number;
  carId: number;
  carReceiptItemId?: number;
  carDescription: string;
  quantity: number;
  /** Quantity originally received on the linked GRN (car receipt) line, read-only once set. */
  receivedQuantity?: number;
  unitPrice?: number;
  salesPrice?: number;
  lineTotal: number;
  carImage?: string | null;
  carName?: string;
  installmentDetails?: {
    downPayment: number;
    numberOfInstallments: number;
    installmentAmount: number;
    firstInstallmentDate: Date;
  };
  trackByBatch?: boolean;
  isPreparationCharge?: boolean;
}
