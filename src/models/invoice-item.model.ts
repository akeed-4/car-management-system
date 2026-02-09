import { BatchAllocation } from './batch.model';

export interface InvoiceItem {
  id?: number;
  returnQuantity?: number;
  carId: number;
  carDescription: string;
  quantity: number;
  unitPrice?: number;
  salesPrice?: number;
  lineTotal: number;
  carImage?: string | null;
  carName?: string;
  vinNumbers?: string[];
  installmentDetails?: {
    downPayment: number;
    numberOfInstallments: number;
    installmentAmount: number;
    firstInstallmentDate: Date;
  };
  batchAllocations?: BatchAllocation[];
  trackByBatch?: boolean;
}
