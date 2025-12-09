import { Injectable, signal } from '@angular/core';
import { CarModel } from '../types/car-model.model';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CarModelService {
   private apiUrl = `${environment.origin.replace(/\/+$/, '')}/car-models`;

  constructor(private http: HttpClient) {}

  getCarModels(): Observable<CarModel[]> {
    return this.http.get<CarModel[]>(this.apiUrl);
  }

  addCarModel(model: Omit<CarModel, 'id'>): Observable<CarModel> {
    return this.http.post<CarModel>(this.apiUrl, model);
  }

  deleteCarModel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}