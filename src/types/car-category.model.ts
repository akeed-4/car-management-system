export interface CarCategory {
  id: number;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  modelId?: number; // List of associated model IDs
}
