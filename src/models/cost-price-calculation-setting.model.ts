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

export const COST_PRICE_CALCULATION_METHODS: CostPriceCalculationMethodOption[] = [
  {
    value: CostPriceCalculationMethod.PurchasePrice,
    labelEn: 'Purchase Price Only',
    labelAr: 'سعر الشراء فقط',
    description: 'Calculate cost based on purchase price only'
  },
  {
    value: CostPriceCalculationMethod.PurchasePlusShipping,
    labelEn: 'Purchase Price + Shipping',
    labelAr: 'سعر الشراء + الشحن',
    description: 'Include shipping costs with purchase price'
  },
  {
    value: CostPriceCalculationMethod.FullCost,
    labelEn: 'Full Cost',
    labelAr: 'التكلفة الكاملة',
    description: 'Include all expenses (shipping, customs, insurance, handling, etc.)'
  },
  {
    value: CostPriceCalculationMethod.AverageCost,
    labelEn: 'Average Cost',
    labelAr: 'متوسط التكلفة',
    description: 'Calculate weighted average cost of inventory'
  },
  {
    value: CostPriceCalculationMethod.FIFO,
    labelEn: 'FIFO (First In, First Out)',
    labelAr: 'الوارد أولا صادر أولا',
    description: 'Cost of oldest inventory items first'
  },
  {
    value: CostPriceCalculationMethod.LIFO,
    labelEn: 'LIFO (Last In, First Out)',
    labelAr: 'الوارد أخيرا صادر أولا',
    description: 'Cost of newest inventory items first'
  },
  {
    value: CostPriceCalculationMethod.StandardCost,
    labelEn: 'Standard Cost',
    labelAr: 'التكلفة المعيارية',
    description: 'Use predetermined standard costs'
  }
];
