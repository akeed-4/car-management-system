

export type DeliveryStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Canceled';

export interface ChecklistItem {
  id: number;
  description: string;
  completed: boolean;
}

export interface Delivery {
  id: number;
  salesInvoiceId: number;
  salesInvoiceNumber: string; // Denormalized for display
  carId: number;
  carDescription: string; // Denormalized for display
  customerId: number;
  customerName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:MM
  deliveryAgentId: number; // User ID
  deliveryAgentName: string; // Denormalized for display
  status: DeliveryStatus;
  checklist: ChecklistItem[];
  notes?: string;
}
    