export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
  category: 'Salaries' | 'Rent' | 'Utilities' | 'Marketing' | 'Maintenance' | 'Other';
  amount: number;
  notes?: string;
  accountId?: number; // Link to Treasury Account
  accountName?: string;
  carId?: number; // Link to a car in inventory
  carDescription?: string; // Denormalized for display
  isArchived?: boolean;
}