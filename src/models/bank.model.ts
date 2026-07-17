export interface Bank {
  id: number;
  bankCode: string;
  bankNameEnglish: string;
  bankNameArabic: string;
  swiftCode: string;
  ibanPrefix: string;
  country: string;
  currency: string;
  notes: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
  createdBy?: number | null;
  createdDate: string;
  modifiedBy?: number | null;
  modifiedDate?: string | null;
}

export interface CreateBankDto {
  bankCode: string;
  bankNameEnglish: string;
  bankNameArabic: string;
  swiftCode: string;
  ibanPrefix: string;
  country: string;
  currency: string;
  notes: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  isActive: boolean;
}

export interface UpdateBankDto extends CreateBankDto {}
