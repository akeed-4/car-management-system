export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  description: string;
  category: string; // e.g., 'Salaries', 'Rent', 'Utilities', 'Marketing', 'Maintenance'
  amount: number;
  notes?: string;
}