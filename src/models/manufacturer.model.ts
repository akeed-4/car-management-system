export interface Manufacturer {
  id: number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  logo?: string | null;
  countryOfOrigin?: string | null;
  isActive?: boolean;
}
