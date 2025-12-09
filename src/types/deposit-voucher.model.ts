
export interface DepositVoucher {
  id: number;
  voucherNumber: string;
  date: string;
  customerId: number;
  customerName: string;
  carId: number;
  carDescription: string;
  amount: number;
  notes?: string;
}
