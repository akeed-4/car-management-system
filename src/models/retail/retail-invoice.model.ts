export type RetailPaymentMethod = 'Cash' | 'Card' | 'Bank Transfer';

export interface RetailPaymentDetails {
  method: RetailPaymentMethod;
  amount: number;
  reference?: string; // Card auth code / bank transfer reference
  hash?: string; // Transaction hash/id for card or bank transfer
}

export interface RetailInvoiceLineSummary {
  id: number;
  carId: number;
  carDescription: string;
  quantity: number;
  unitPrice: number;
  salesPrice: number;
  lineTotal: number;
}

export interface RetailInvoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: number;
  customerName: string;
  paymentMethod: string;
  transactionHash: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  isCash: boolean;
  createdAt: string;
  items: RetailInvoiceLineSummary[];
}

export interface CreateRetailInvoiceDto {
  retailSalesOrderId: number;
  retailQuotationId: number;
  paymentMethod: string;
  transactionHash: string;
  debitAccountId: number;
  creditAccountId: number;
  userId: number;
}
