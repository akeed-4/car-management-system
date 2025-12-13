import { Injectable, signal } from '@angular/core';
import { CarModel } from '../types/car-model.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { promises } from 'dns';

@Injectable({
  providedIn: 'root',
})
export class CarModelService {
   private apiUrl = environment.origin+'api/CarModels';
   private carmodel = signal<CarModel[]>([]);
   public carmodel$ = this.carmodel.asReadonly();
  constructor(private http: HttpClient) {
    this.loadCarModelsFromApi();
  }

  async loadCarModelsFromApi() {
    try {
      const data = await firstValueFrom(this.http.get<CarModel[]>(this.apiUrl));
      this.carmodel.set(data);
    } catch (error) {
      console.error('Failed to fetch car models from API', error);
    }
  }

  getCarModels(): Observable<CarModel[]> {
    return this.http.get<CarModel[]>(this.apiUrl);
  }

 async addCarModel(model: Omit<CarModel, 'id'>): Promise<void> {
     await firstValueFrom(this.http.post<CarModel>(this.apiUrl, model));
     // Reload the list from API
     await this.loadCarModelsFromApi();
  }

  async updateCarModel(id: number, model: Omit<CarModel, 'id'>): Promise<void> {
    await firstValueFrom(this.http.put<CarModel>(`${this.apiUrl}/${id}`, model));
    // Reload the list from API
    await this.loadCarModelsFromApi();
  }

  deleteCarModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}