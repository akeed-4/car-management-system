export interface OrderFulfillmentProgress {
  orderId: number;
  totalOrdered: number;
  totalDelivered: number;
  remaining: number;
}

export interface RemainingVinCandidate {
  carId: number;
  vin: string;
  make: string;
  model: string;
  year: number;
}

export interface CorporateBatchDispatch {
  id?: number;
  orderId: number;
  carIds: number[];
  dispatchedAt?: string;
  status?: 'Pending' | 'Dispatched';
}

export interface ProcessBatchDto {
  orderId: number;
  carIds: number[];
}
