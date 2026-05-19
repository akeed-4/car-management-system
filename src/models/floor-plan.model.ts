export interface FloorPlan {
  id: number;
  carId: number;
  financierId: number;
  financedAmount: number;
  startDate: string;
  annualInterestRate: number;
  gracePeriodDays: number;
}
