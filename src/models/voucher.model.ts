export enum VoucherStatus {
  Draft = 1,
  Approved = 2,
  Cancelled = 3
}

export interface Voucher {
  id?: number;
  voucherNumber: string;
  voucherDate: Date;
  amount: number;
  status: VoucherStatus;
  notes?: string;
  createdAt?: Date;
  createdBy?: number;
}