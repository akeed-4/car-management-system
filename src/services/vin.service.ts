import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface VinData {
  id?: number;
  vinNumber: string;
  purchaseInvoiceItemId?: number;
 carId?: number;
 carName?: string;   
  status: 'Active' | 'Sold' | 'Reserved' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VinService {
  private http = inject(HttpClient);
  private apiUrl = environment.origin + 'api/VinManagement';

  constructor() {}

  // Get all VINs
  getAllVins(): Observable<VinData[]> {
    return this.http.get<VinData[]>(this.apiUrl + '/GetAll');
  }

  // Get VINs by purchase invoice item
  getVinsByPurchaseItem(itemId: number): Observable<VinData[]> {
    return this.http.get<VinData[]>(`${this.apiUrl}/GetByPurchaseItem/${itemId}`);
  }

  // Get VINs by car
  getVinsByCar(carId: number): Observable<VinData[]> {
    return this.http.get<VinData[]>(`${this.apiUrl}/GetByCar/${carId}`);
  }

  // Create multiple VINs
  createVins(vins: any): Observable<VinData[]> {
    return this.http.post<VinData[]>(this.apiUrl + '/generate-range', vins);
  }

  // Update VIN
  updateVin(id: number, vin: Partial<VinData>): Observable<VinData> {
    return this.http.put<VinData>(`${this.apiUrl}/Update/${id}`, vin);
  }

  // Delete VIN
  deleteVin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  // Bulk delete VINs
  deleteVins(ids: number[]): Observable<void> {
    return this.http.post<void>(this.apiUrl + '/DeleteBulk', { ids });
  }

  // Validate VIN uniqueness
  validateVins(vinNumbers: string[]): Observable<{ valid: boolean; duplicates: string[] }> {
    return this.http.post<{ valid: boolean; duplicates: string[] }>(this.apiUrl + '/Validate', { vinNumbers });
  }

  // Import VINs from Excel
  importFromExcel(formData: FormData): Observable<{ imported: number; duplicates: string[]; errors: string[] }> {
    return this.http.post<{ imported: number; duplicates: string[]; errors: string[] }>(this.apiUrl + '/ImportExcel', formData);
  }

  // Generate VIN range
  generateVinRange(startVin: string, endVin: string, purchaseInvoiceItemId?: number, carId?: number): Observable<VinData[]> {
    return this.http.post<VinData[]>(this.apiUrl + '/generateRange', {
      startVin,
      endVin,
      purchaseInvoiceItemId,
      carId
    });
  }
}