import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Car, CarStatus, CarLocation } from '../types/car.model';
import { Observable, tap, switchMap, firstValueFrom } from 'rxjs';
import { env } from 'process';
import { environment } from '../environments/environment';
import { promises } from 'dns';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = environment.origin+ 'api/Cars';
  private cars = signal<Car[]>([]);
  public cars$ = this.cars.asReadonly();

  // Computed signal for available vehicles (excluding sold or reserved)
  public availableVehicles$ = this.cars.asReadonly();

  constructor(private http: HttpClient) {
    this.loadCars();
  }

  loadCars() {
    this.getCars().subscribe(cars => this.cars.set(cars));
  }

  // =======================
  // GET
  // =======================
  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  getCarById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get only available vehicles (status = 'Available', not sold or reserved)
   * Used by Vehicle Lookup Modal in Sales Invoice
   */
  getAvailableVehicles(): Observable<Car[]> {
    return this.getCars().pipe(
      tap(cars => {
        const available = cars.filter(car => car.status === 'Available');
        this.cars.set(available);
      })
    );
  }

  // =======================
  // POST
  // =======================
async addCar(car: Omit<Car, 'id' | 'totalCost'>): Promise<Car> {
  const newCar = { ...car, totalCost: car.purchasePrice + car.additionalCosts };
  // Format istimaraExpiry as "yyyy-MM-dd" or set to null
  if (newCar.istimaraExpiry) {
    const date = new Date(newCar.istimaraExpiry);
    if (!isNaN(date.getTime())) {
      newCar.istimaraExpiry = date.toISOString().split('T')[0]; // "yyyy-MM-dd"
    } else {
      newCar.istimaraExpiry = null;
    }
  } else {
    newCar.istimaraExpiry = null;
  }
  const addedCar = await firstValueFrom(this.http.post<Car>(this.apiUrl + '/Create', newCar));
  // Refresh the cars list
  this.loadCars();
  return addedCar;
}
  // =======================
  // PUT / PATCH
  // =======================
  updateCar(updatedCar: Car): Observable<Car> {
    console.log('Updating car', updatedCar);
    return this.http.put<Car>(`${this.apiUrl}/Update/${updatedCar.id}`, updatedCar).pipe(
      tap(() => this.loadCars())
    );
  }

  updateCarStatus(id: number, status: CarStatus): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { status }).pipe(
      tap(() => this.loadCars())
    );
  }

  updateCarLocation(id: number, location: CarLocation): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { currentLocation: location }).pipe(
      tap(() => this.loadCars())
    );
  }

  setCarQuantity(id: number, quantity: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { quantity }).pipe(
      tap(() => this.loadCars())
    );
  }

  incrementCarQuantity(id: number, increment: number): Observable<Car> {
    return this.getCarById(id).pipe(
      switchMap(car => this.setCarQuantity(id, car.quantity + increment))
    );
  }

  decrementCarQuantity(id: number, decrement: number): Observable<Car> {
    return this.getCarById(id).pipe(
      switchMap(car => this.setCarQuantity(id, car.quantity - decrement))
    );
  }

  // =======================
  // DELETE
  // =======================
  deleteCar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`).pipe(
      tap(() => this.loadCars())
    );
  }

  archiveCar(id: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { isArchived: true }).pipe(
      tap(() => this.loadCars())
    );
  }

  unarchiveCar(id: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { isArchived: false }).pipe(
      tap(() => this.loadCars())
    );
  }
}
