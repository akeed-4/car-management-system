
export interface InvoiceItem {
  id?: number;
  /** Client-side-only unique row identity for the line-items grid. `carId` is a business field,
   * not a row key -- a vehicle's preparation-charge lines reuse the same carId as its main sales
   * line, so grids keyed on carId can't tell those rows apart (edits/removals on one silently hit
   * both). Never sent to the backend -- stripped before building the save payload. */
  lineKey?: number;
  returnQuantity?: number;
  carId: number;
  carReceiptItemId?: number;
  carsReceiptNoteItemId?: number;
  carDescription: string;
  quantity: number;
  /** Quantity originally received on the linked GRN (car receipt) line, read-only once set. */
  receivedQuantity?: number;
  unitPrice?: number;
  salesPrice?: number;
  lineTotal: number;
  carImage?: string | null;
  carName?: string;
  /** Minimal nested Car payload (VIN only) the backend now populates for the printable invoice's
   * line-items table -- not present on older cached responses, so always guard with `?.`. */
  car?: { id: number; vin: string };
  installmentDetails?: {
    downPayment: number;
    numberOfInstallments: number;
    installmentAmount: number;
    firstInstallmentDate: Date;
  };
  trackByBatch?: boolean;
  isPreparationCharge?: boolean;
}
