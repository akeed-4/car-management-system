import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Store } from '../types/branch.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  private apiUrl = environment.origin + 'api/Stores';

  private stores = signal<Store[]>([]);
  public stores$ = this.stores.asReadonly();

  constructor(private http: HttpClient) {
    this.loadStores();
  }

  /** Load stores from API */
  loadStores() {
    this.http.get<Store[]>(`${this.apiUrl}/GetAll`).subscribe({
      next: (data) => {
        this.stores.set(data);
        console.log('Stores loaded', data);
      },
      error: (error) => {
        console.error('Failed to load stores', error);
      }
    });
  }

  // Get all stores with optional paging/sorting
  getAll(params?: any): Observable<Store[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Store[]>(`${this.apiUrl}/GetAll`, { params: httpParams }).pipe(
      tap(data => this.stores.set(data))
    );
  }

  // Get store by ID
  getById(id: number): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/GetById/${id}`);
  }

  // Create new store
  create(store: Omit<Store, 'id' | 'createdAt' | 'updatedAt'>): Observable<Store> {
    // Transform the store object to match API expectations
    const apiPayload = {
      ...store,
      name: typeof store.name === 'object' ? store.name.en : store.name // Extract English name as string
    };
    return this.http.post<Store>(`${this.apiUrl}/Create`, apiPayload).pipe(
      tap(() => this.loadStores()) // Reload stores after creation
    );
  }

  // Update existing store
  update(id: number, store: Partial<Store>): Observable<Store> {
    // Transform the store object to match API expectations
    const apiPayload = {
      ...store,
      name: typeof store.name === 'object' ? store.name.en : store.name // Extract English name if it's an object
    };
    return this.http.put<Store>(`${this.apiUrl}/Update/${id}`, apiPayload).pipe(
      tap(() => this.loadStores()) // Reload stores after update
    );
  }

  // Delete store
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`).pipe(
      tap(() => this.loadStores()) // Reload stores after deletion
    );
  }
}