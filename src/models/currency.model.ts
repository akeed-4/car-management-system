export interface Currency {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCurrencyDto {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

export interface UpdateCurrencyDto extends CreateCurrencyDto {}
