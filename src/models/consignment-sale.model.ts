import { CommissionType } from './consignment-car.model';

export type ConsignmentSaleStatus = 'Posted' | 'Cancelled' | 'Returned';

export interface ConsignmentSale {
  id: number;
  saleNumber: string;

  consignmentCarId: number;
  consignmentNumber: string;
  make: string;
  model: string;
  vin: string;
  supplierId: number;
  supplierName: string;

  customerId: number;
  customerName: string;

  saleDate: string;
  salePrice: number;

  commissionType: CommissionType;
  commissionRate: number;
  commissionAmount: number;
  ownerProceeds: number;

  isCash: boolean;
  amountPaid: number;
  amountDue: number;

  debitAccountId: number;
  debitAccountName: string;
  commissionRevenueAccountId: number;
  commissionRevenueAccountName: string;
  ownerPayableAccountId: number;
  ownerPayableAccountName: string;

  status: ConsignmentSaleStatus;
  notes?: string;

  createdBy: number;
  createdAt: string;
  updatedAt?: string | null;
  cancelledAt?: string | null;
}

export interface CreateConsignmentSaleDto {
  consignmentCarId: number;
  customerId: number;
  saleDate: string;
  salePrice: number;

  /** Omit to inherit the ConsignmentCar's own commission defaults. */
  commissionType?: CommissionType;
  commissionRate?: number;
  commissionFixedAmount?: number;

  isCash: boolean;
  amountPaid: number;

  debitAccountId: number;
  commissionRevenueAccountId: number;
  ownerPayableAccountId: number;

  notes?: string;
  createdBy: number;
}
