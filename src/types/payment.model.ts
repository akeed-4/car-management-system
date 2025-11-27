export interface Payment {
  id: number;
  date: string; // YYYY-MM-DD
  paymentNumber: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'Cash' | 'Check' | 'BankTransfer' | 'CreditCard';
  description: string;
  notes?: string;
}
