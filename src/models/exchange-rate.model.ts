export interface CurrencyExchangeRate {
  id: number;
  fromCurrencyId: number;
  fromCurrencyCode: string;
  toCurrencyId: number;
  toCurrencyCode: string;
  rate: number;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateExchangeRateDto {
  fromCurrencyId: number;
  toCurrencyId: number;
  rate: number;
  effectiveDate: string;
  isActive: boolean;
}

export interface UpdateExchangeRateDto {
  rate: number;
  effectiveDate: string;
  isActive: boolean;
}
