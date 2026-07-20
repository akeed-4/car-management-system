export interface StoreCarStockDto {
  id: number;
  storeId: number;
  storeName: string;
  carId: number;
  carName: string;
  carDescription: string;
  availableQuantity: number;
  quantity: number;
  reservedQuantity: number;
  lastUpdatedAt: string;
  salesPrice?: number;
  /** Raw identification fields -- same core shape as Car -- so buildVehicleDescription() can be
   * used consistently instead of assuming carName/carDescription already have the right text. */
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin?: string | null;
  plateNumber?: string | null;
}