import { Injectable, signal } from '@angular/core';
import { environment } from '../environments/environment';
import { ConsignmentCar } from '../types/consignment-car.model';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConsignmentService {
  private apiUrl = `${environment.origin}/api/consignments`;

  constructor(private http: HttpClient) {}

  private consignmentCars = signal<ConsignmentCar[]>([]);
  public consignmentCars$ = this.consignmentCars.asReadonly();

  // ------- Get All --------------------------------------------------------
  loadAll() {
    this.http.get<ConsignmentCar[]>(this.apiUrl).pipe(
      catchError(() => of([]))
    ).subscribe(result => {
      this.consignmentCars.set(result);
    });
  }

  // ------- Get By ID ------------------------------------------------------
  getById(id: number) {
    return this.http.get<ConsignmentCar>(`${this.apiUrl}/${id}`);
  }

  // ------- Create ---------------------------------------------------------
  addConsignmentCar(car: Omit<ConsignmentCar, 'id'>) {
    this.http.post<ConsignmentCar>(this.apiUrl, car).pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (result) {
        this.consignmentCars.update(list => [...list, result]);
      }
    });
  }

  // ------- Update ---------------------------------------------------------
  updateConsignmentCar(updatedCar: ConsignmentCar) {
    const url = `${this.apiUrl}/${updatedCar.id}`;
    this.http.put<ConsignmentCar>(url, updatedCar).pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (result) {
        this.consignmentCars.update(list =>
          list.map(c => (c.id === result.id ? result : c))
        );
      }
    });
  }

  // ------- Sell Car -------------------------------------------------------
  sellConsignmentCar(carId: number, salePrice: number) {
    const url = `${this.apiUrl}/${carId}/sell`;
    this.http.post<ConsignmentCar>(url, { salePrice }).pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (result) {
        this.consignmentCars.update(list =>
          list.map(c => (c.id === result.id ? result : c))
        );
      }
    });
  }

  // ------- Delete ---------------------------------------------------------
  deleteConsignmentCar(id: number) {
    this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.consignmentCars.update(list => list.filter(c => c.id !== id));
    });
  }

  // ------- Archive --------------------------------------------------------
  archiveConsignmentCar(id: number) {
    this.http.post(`${this.apiUrl}/${id}/archive`, {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.consignmentCars.update(list =>
        list.map(c => c.id === id ? { ...c, isArchived: true } : c)
      );
    });
  }

  unarchiveConsignmentCar(id: number) {
    this.http.post(`${this.apiUrl}/${id}/unarchive`, {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.consignmentCars.update(list =>
        list.map(c => c.id === id ? { ...c, isArchived: false } : c)
      );
    });
  }
}
