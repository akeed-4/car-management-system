export interface PurchaseOffer {
  id: number;
  offerNumber: string;
  offerDate: string;
  supplierId: number;
  supplier?: Supplier;
  carDescription: string;
  make: string;
  model: string;
  year: number;
  offeredPrice: number;
  status: string; // Pending, Accepted, Rejected
  notes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: number;
  name: string;
  // Add other supplier fields as needed
}