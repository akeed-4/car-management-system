import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { VehicleColor, CreateVehicleColorDto, UpdateVehicleColorDto } from '../models/vehicle-color.model';

@Injectable({
  providedIn: 'root'
})
export class VehicleColorService {
  private readonly baseUrl = `${environment.origin}api/VehicleColors`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VehicleColor[]> {
    return this.http.get<VehicleColor[]>(`${this.baseUrl}/GetAll`);
  }

  /** Active colors only -- use this (not getAll) for the Vehicle Card's Exterior/Interior Color
   * dropdowns, so an inactive color can never be newly selected. */
  getActive(): Observable<VehicleColor[]> {
    return this.http.get<VehicleColor[]>(`${this.baseUrl}/Active`);
  }

  getById(id: number): Observable<VehicleColor> {
    return this.http.get<VehicleColor>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateVehicleColorDto): Observable<VehicleColor> {
    return this.http.post<VehicleColor>(`${this.baseUrl}/Create`, dto);
  }

  update(id: number, dto: UpdateVehicleColorDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto);
  }

  /** Deactivates the color -- the backend never physically deletes a vehicle color. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`);
  }
}
