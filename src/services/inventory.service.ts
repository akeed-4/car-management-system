import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Car, CarStatus, CarLocation } from '../models/car.model';
import { Observable, tap, switchMap, firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import CustomStore from 'devextreme/data/custom_store';
import { ReportDataSourceService } from './report-data-source.service';

export interface CarGridRow {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  exteriorColor: string;
  status: string;
  mileage: number;
  purchasePrice: number;
  salePrice: number;
  totalCost: number;
  purchaseDate?: string;
  createdAt: string;
}

export interface VehicleLookupFilter {
  vin?: string;
  plateNumber?: string;
  make?: string;
  model?: string;
  exteriorColor?: string;
  year?: number;
  customerId?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private apiUrl = environment.origin+ 'api/Cars';
  private cars = signal<Car[]>([]);
  public cars$ = this.cars.asReadonly();

  // Computed signal for available vehicles (excluding sold or reserved)
  public availableVehicles$ = this.cars.asReadonly();

  private reportDataSourceService = inject(ReportDataSourceService);

  constructor(private http: HttpClient) {
    this.loadCars();
  }

  /**
   * Server-side paged/sorted/filtered CustomStore for the Inventory List grid, backed by
   * CarsController's GET api/Cars/grid (DataSourceLoadOptions -> DataSourceLoader.LoadAsync over
   * ICarReportService.GetCarsQuery). Replaces the old pattern of loading the entire cars$ array
   * into the browser and filtering/sorting/paging it client-side.
   */
  createCarsGridStore(): CustomStore<CarGridRow> {
    return this.reportDataSourceService.createStore<CarGridRow>('Cars/grid', { key: 'id' });
  }

  loadCars() {
    this.getCars().subscribe(cars => this.cars.set(cars));
  }

  // =======================
  // GET
  // =======================
  getCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl + '/GetAll');
  }

  getCarById(id: number): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl + '/GetById'}/${id}`);
  }

  getCarsByPurchaseInvoice(invoiceId: number): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/GetByPurchaseInvoice/${invoiceId}`);
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

  /**
   * Multi-field vehicle lookup for selection popups (VIN, plate, make, model, color, year,
   * customer). Every supplied filter is ANDed server-side; defaults to Available-only unless
   * a status is explicitly supplied. Does not touch the cars$ signal -- callers own the result.
   */
  lookupCars(filter: VehicleLookupFilter): Observable<Car[]> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key.charAt(0).toUpperCase() + key.slice(1), value);
      }
    });
    return this.http.get<Car[]>(`${this.apiUrl}/lookup`, { params });
  }

  // =======================
  // POST
  // =======================
async addCar(car: Omit<Car, 'id' | 'totalCost'>): Promise<Car> {
  const newCar = { ...car };
  
  // Remove any undefined or null values that shouldn't be sent
  Object.keys(newCar).forEach(key => {
    if (newCar[key as keyof typeof newCar] === undefined || newCar[key as keyof typeof newCar] === '') {
      delete newCar[key as keyof typeof newCar];
    }
  });
  
  // Format istimaraExpiry as "yyyy-MM-dd" or remove it if invalid
  if (newCar.istimaraExpiry) {
    const date = new Date(newCar.istimaraExpiry);
    if (!isNaN(date.getTime())) {
      newCar.istimaraExpiry = date.toISOString().split('T')[0]; // "yyyy-MM-dd"
    } else {
      delete (newCar as any).istimaraExpiry;
    }
  }
  
  // Format purchaseDate similarly
  if (newCar.purchaseDate) {
    const date = new Date(newCar.purchaseDate);
    if (!isNaN(date.getTime())) {
      newCar.purchaseDate = date.toISOString().split('T')[0];
    } else {
      delete (newCar as any).purchaseDate;
    }
  }
  
  console.log('Sending car data to backend:', newCar);
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
