export interface VehicleColor {
  id: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateVehicleColorDto {
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

export interface UpdateVehicleColorDto extends CreateVehicleColorDto {}
