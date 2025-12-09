import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Car, CarStatus, CarLocation } from '../types/car.model';
import { Observable, tap, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = 'https://your-api.com/cars'; // ضع رابط API هنا

  private cars = signal<Car[]>([]);
  public cars$ = this.cars.asReadonly();

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

  // =======================
  // POST
  // =======================
  addCar(car: Omit<Car, 'id' | 'totalCost'>): Observable<Car> {
    const newCar = { ...car, totalCost: car.purchasePrice + car.additionalCosts };
    return this.http.post<Car>(this.apiUrl, newCar);
  }

  // =======================
  // PUT / PATCH
  // =======================
  updateCar(updatedCar: Car): Observable<Car> {
    return this.http.put<Car>(`${this.apiUrl}/${updatedCar.id}`, updatedCar);
  }

  updateCarStatus(id: number, status: CarStatus): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { status });
  }

  updateCarLocation(id: number, location: CarLocation): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { currentLocation: location });
  }

  setCarQuantity(id: number, quantity: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { quantity });
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
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  archiveCar(id: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { isArchived: true });
  }

  unarchiveCar(id: number): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/${id}`, { isArchived: false });
  }
}
