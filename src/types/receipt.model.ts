export interface Receipt {
  id: number;
  date: string; // YYYY-MM-DD
  receiptNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Check' | 'BankTransfer' | 'CreditCard';
  description: string;
  notes?: string;
}
