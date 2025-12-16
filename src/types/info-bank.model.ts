export interface InfoBank {
  id?: number;
  name: string;
  accountNumber: string;
  branch: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isActive: boolean;
}