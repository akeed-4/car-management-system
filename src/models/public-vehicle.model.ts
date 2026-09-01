/** Mirrors CarERP.Core/DTOs/Public/PublicVehicleDto.cs -- the explicit allow-list returned by the
 *  anonymous public vehicle page endpoint. Never widen this to the full Car model. */
export interface PublicVehicle {
  publicId: string;
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  mileage: number;
  transmission: string;
  condition: string;
  description: string;
  photos: string[];
  /** Null when sold, or when the dealership has price display turned off for public pages. */
  salePrice: number | null;
  isSold: boolean;
  dealershipName: string;
  dealershipPhone?: string | null;
}
