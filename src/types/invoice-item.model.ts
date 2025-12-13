export interface InvoiceItem {
  carId: number;
  carDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  carImage?: string | null;
  carName?: string;
  installmentDetails?: {
    downPayment: number;
    numberOfInstallments: number;
    installmentAmount: number;
    firstInstallmentDate: Date;
  };
}
