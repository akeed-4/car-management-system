export enum SaleType {
  Cash = 'cash',
  Credit = 'credit',
  Installments = 'installments'
}

export interface SalesEnhancement {
  saleType: SaleType;
  downPayment?: number;
  contractEditable: boolean;
  linkedCar?: {
    chassisNumber?: string;
    plateNumber?: string;
  };
}

export interface Installment {
  id: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
  overdue: boolean;
  latePenalty?: number;
  paymentDate?: Date;
}

export interface InstallmentSchedule {
  id: number;
  contractId: number;
  installments: Installment[];
  totalAmount: number;
  downPayment: number;
  interestRate: number;
  termMonths: number;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallmentReschedule {
  id: number;
  originalScheduleId: number;
  newSchedule: InstallmentSchedule;
  reason: string;
  rescheduledAt: Date;
  history: InstallmentReschedule[];
}

export interface PaymentRegistration {
  installmentId: number;
  paymentAmount: number;
  paymentDate: Date;
  notes?: string;
}