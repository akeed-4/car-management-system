import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Manufacturer } from '../types/manufacturer.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ManufacturerService {
  private manufacturers = signal<Manufacturer[]>([]);
  public manufacturers$ = this.manufacturers.asReadonly();

  // رابط API الخاص بك
  private apiUrl = environment.origin + 'api/Manufacturers';

  constructor(private http: HttpClient) {
    this.loadManufacturersFromApi();
  }

  async loadManufacturersFromApi() {
    try {
      const data = await firstValueFrom(this.http.get<Manufacturer[]>(this.apiUrl));
      this.manufacturers.set(data);
    } catch (error) {
      console.error('Failed to fetch manufacturers from API', error);
    }
  }

  async addManufacturer(manufacturer: Omit<Manufacturer, 'id'>): Promise<void> {
    try {
      // Send to API
      await firstValueFrom(this.http.post(this.apiUrl + '/Create', manufacturer));
      // Reload the list from API
      await this.loadManufacturersFromApi();
    } catch (error) {
      console.error('Failed to add manufacturer', error);
      throw error;
    }
  }

  async updateManufacturer(id: number, manufacturer: Omit<Manufacturer, 'id'>): Promise<void> {
    try {
      // Send update to API
      await firstValueFrom(this.http.put(`${this.apiUrl}/${id}`, manufacturer));
      // Reload the list from API
      await this.loadManufacturersFromApi();
    } catch (error) {
      console.error('Failed to update manufacturer', error);
      throw error;
    }
  }

  async deleteManufacturer(id: number): Promise<void> {
    try {
      // Send delete to API
      await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
      // Reload the list from API
      await this.loadManufacturersFromApi();
    } catch (error) {
      console.error('Failed to delete manufacturer', error);
      throw error;
    }
  }
}
