export interface CostPriceCalculationSetting {
  id?: number;
  companyId: number;
  calculationMethod: CostPriceCalculationMethod;
  includeShippingCost: boolean;
  includeCustomsDuties: boolean;
  includeInsurance: boolean;
  includeHandlingFees: boolean;
  includeOtherExpenses: boolean;
  defaultMarkupPercentage: number;
  applyVAT: boolean;
  vatPercentage: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export enum CostPriceCalculationMethod {
  PurchasePrice = 'PURCHASE_PRICE', // سعر الشراء فقط
  PurchasePlusShipping = 'PURCHASE_PLUS_SHIPPING', // سعر الشراء + الشحن
  FullCost = 'FULL_COST', // التكلفة الكاملة (كل المصاريف)
  AverageCost = 'AVERAGE_COST', // متوسط التكلفة
  FIFO = 'FIFO', // الوارد أولا صادر أولا
  LIFO = 'LIFO', // الوارد أخيرا صادر أولا
  StandardCost = 'STANDARD_COST' // التكلفة المعيارية
}

export interface CostPriceCalculationMethodOption {
  value: CostPriceCalculationMethod;
  labelEn: string;
  labelAr: string;
  description: string;
}

// Only these two methods are offered in the settings UI. The remaining enum values are kept
// (not deleted) so existing CostPriceCalculationSetting rows using them keep working.
export const COST_PRICE_CALCULATION_METHODS: CostPriceCalculationMethodOption[] = [
  {
    value: CostPriceCalculationMethod.FullCost,
    labelEn: 'Total Purchase Cost',
    labelAr: 'إجمالي تكلفة الشراء',
    description: 'Include all expenses (shipping, customs, insurance, handling, etc.)'
  },
  {
    value: CostPriceCalculationMethod.AverageCost,
    labelEn: 'Weighted Average Cost',
    labelAr: 'المتوسط المرجح',
    description: 'Calculate weighted average cost of inventory'
  }
];
