export interface Country {
  id: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface Region {
  id: number;
  countryId: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface City {
  id: number;
  regionId: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface District {
  id: number;
  cityId: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}
