import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CostCenter, CostCenterEntry, CreateCostCenterDto, UpdateCostCenterDto, CreateCostCenterEntryDto } from '../types/cost-center.model';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CostCenterService {
  private costCentersSubject = new BehaviorSubject<CostCenter[]>([]);
  private entriesSubject = new BehaviorSubject<CostCenterEntry[]>([]);

  public costCenters$ = this.costCentersSubject.asObservable();
  public entries$ = this.entriesSubject.asObservable();

  private apiUrl = environment.origin + 'api/CostCenters';
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  constructor(private http: HttpClient) {
    // Removed loadSampleData() call to use real API
  }

  // Cost Center CRUD
  getCostCenters(): Observable<CostCenter[]> {
    console.log('Making GET request to:', `${this.apiUrl}`);
    return this.http.get<any>(`${this.apiUrl}/GetAll`, { headers: this.headers }).pipe(
      map(response => {
        console.log('Received cost centers response:', response);
        // Extract the data array from the API response
        const costCenters = Array.isArray(response) ? response : (response as any).data || [];
        console.log('Extracted cost centers array:', costCenters);
        // Set parentId for partial cost centers
        const processedCostCenters = costCenters.map(costCenter => {
          let parentId = costCenter.parentId;
          // Fix self-referencing parentId
          if (parentId === costCenter.id) {
            parentId = null;
          }
          return {
            ...costCenter,
            parentId
          };
        });
        this.costCentersSubject.next(processedCostCenters);
        return processedCostCenters;
      }),
      catchError(error => {
        console.error('Error fetching cost centers:', error);
        return throwError(() => new Error('Failed to fetch cost centers'));
      })
    );
  }

  getCostCenterById(id: number): Observable<CostCenter | undefined> {
    return this.http.get<CostCenter>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching cost center ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch cost center ${id}`));
      })
    );
  }

  getCostCentersByCarId(carId: number): Observable<CostCenter[]> {
    return this.http.get<CostCenter[]>(`${this.apiUrl}?carId=${carId}`).pipe(
      catchError(error => {
        console.error(`Error fetching cost centers for car ${carId}:`, error);
        return throwError(() => new Error(`Failed to fetch cost centers for car ${carId}`));
      })
    );
  }

  createCostCenter(dto: CreateCostCenterDto): Observable<CostCenter> {
    console.log('Making POST request to:', `${this.apiUrl}/Create`);
    console.log('Sending DTO:', dto);
    return this.http.post<CostCenter>(`${this.apiUrl}/Create`, dto, { headers: this.headers }).pipe(
      map(costCenter => {
        // Update local state
        const current = this.costCentersSubject.value;
        this.costCentersSubject.next([...current, costCenter]);
        return costCenter;
      }),
      catchError(error => {
        console.error('Error creating cost center:', error);
        return throwError(() => new Error('Failed to create cost center'));
      })
    );
  }

  updateCostCenter(dto: UpdateCostCenterDto): Observable<CostCenter> {
    return this.http.put<CostCenter>(`${this.apiUrl}/Update/${dto.id}`, dto).pipe(
      map(costCenter => {
        // Update local state
        const current = this.costCentersSubject.value;
        const index = current.findIndex(c => c.id === dto.id);
        if (index !== -1) {
          current[index] = costCenter;
          this.costCentersSubject.next([...current]);
        }
        return costCenter;
      }),
      catchError(error => {
        console.error(`Error updating cost center ${dto.id}:`, error);
        return throwError(() => new Error(`Failed to update cost center ${dto.id}`));
      })
    );
  }

  deleteCostCenter(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`).pipe(
      map(() => {
        // Update local state
        const current = this.costCentersSubject.value;
        const filtered = current.filter(c => c.id !== id);
        this.costCentersSubject.next(filtered);
      }),
      catchError(error => {
        console.error(`Error deleting cost center ${id}:`, error);
        return throwError(() => new Error(`Failed to delete cost center ${id}`));
      })
    );
  }

  // Cost Center Entries
  getEntriesByCostCenter(costCenterId: number): Observable<CostCenterEntry[]> {
    return this.http.get<CostCenterEntry[]>(`${this.apiUrl}/${costCenterId}/entries`).pipe(
      map(entries => {
        this.entriesSubject.next(entries);
        return entries;
      }),
      catchError(error => {
        console.error(`Error fetching entries for cost center ${costCenterId}:`, error);
        return throwError(() => new Error(`Failed to fetch entries for cost center ${costCenterId}`));
      })
    );
  }

  createEntry(dto: CreateCostCenterEntryDto): Observable<CostCenterEntry> {
    return this.http.post<CostCenterEntry>(`${this.apiUrl}/entries`, dto, { headers: this.headers }).pipe(
      map(entry => {
        // Update local state
        const current = this.entriesSubject.value;
        this.entriesSubject.next([...current, entry]);
        // Update total costs
        this.updateCostCenterTotal(dto.costCenterId, dto.amount);
        return entry;
      }),
      catchError(error => {
        console.error('Error creating entry:', error);
        return throwError(() => new Error('Failed to create entry'));
      })
    );
  }

  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/entries/${id}`).pipe(
      map(() => {
        // Update local state
        const current = this.entriesSubject.value;
        const entry = current.find(e => e.id === id);
        if (entry) {
          this.updateCostCenterTotal(entry.costCenterId, -entry.amount);
        }
        const filtered = current.filter(e => e.id !== id);
        this.entriesSubject.next(filtered);
      }),
      catchError(error => {
        console.error(`Error deleting entry ${id}:`, error);
        return throwError(() => new Error(`Failed to delete entry ${id}`));
      })
    );
  }

  private updateCostCenterTotal(costCenterId: number, amountDelta: number): void {
    const centers = this.costCentersSubject.value;
    const center = centers.find(c => c.id === costCenterId);
    if (center) {
      center.totalCosts += amountDelta;
      center.updatedAt = new Date();
      this.costCentersSubject.next([...centers]);
    }
  }
}
