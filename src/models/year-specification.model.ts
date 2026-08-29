/** Trim + Model Year technical specification -- completes the
 *  Make -> Model -> Trim -> YearSpecification -> Vehicle hierarchy. Belongs to a Trim
 *  (CarCategory) and a Model Year (ManufactureYear); a Vehicle references one of these instead of
 *  duplicating engine/horsepower/etc. data on every VIN. */
export interface YearSpecification {
  id: number;
  trimId: number;
  trimName: string;
  trimNameAr: string;
  trimNameEn: string;
  modelId: number;
  modelName: string;
  manufacturerId: number;
  manufacturerName: string;
  yearId: number;
  year: number;

  engineType: string;
  engineCapacity: string;
  cylinderCount?: number | null;
  horsepower?: number | null;
  fuelType: string;
  transmission: string;
  driveType: string;
  standardAgencyPrice: number;

  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export type CreateYearSpecification = Omit<YearSpecification,
  'id' | 'trimName' | 'trimNameAr' | 'trimNameEn' | 'modelId' | 'modelName' |
  'manufacturerId' | 'manufacturerName' | 'year' | 'createdAt' | 'updatedAt'>;
