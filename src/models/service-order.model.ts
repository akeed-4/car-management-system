

export type ServiceOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Canceled';

export interface ServiceItem {
  description: string;
  cost: number;
}

export interface ServiceOrder {
  id: number;
  orderNumber: string;
  dateIn: string;
  dateOut?: string;
  status: ServiceOrderStatus;
  
  // Link to inventory car OR external customer
  carId?: number; // Optional: if it's an inventory car
  carDescription?: string; // Denormalized: e.g., "Toyota Camry (2023)"
  
  customerName: string; // For both inventory car's buyer or external customer
  customerPhone?: string; // Optional: if external customer
  
  serviceItems: ServiceItem[];
  totalCost: number;
  notes?: string;
}
    