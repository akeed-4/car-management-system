export interface StoreCarStockDto {
  id: number;
  storeId: number;
  storeName: string;
  carId: number;
  carName:string
  carDescription: string;
  availableQuantity: number;
  quantity: number;
  reservedQuantity: number;
  lastUpdatedAt: string;
}