import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CarCategory } from '../types/car-category.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CarCategoryService {
  private apiUrl = environment.origin + 'api/CarCategories';

  private categories = signal<CarCategory[]>([]);
  public categories$ = this.categories.asReadonly();

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  /** Load categories from API */
  loadCategories(): void {
    this.http.get<CarCategory[]>(this.apiUrl + '/GetAll').subscribe({
      next: (data) => {
        this.categories.set(data);
        console.log('Car categories loaded', data);
      },
      error: (error) => {
        console.error('Failed to load car categories', error);
      },
    });
  }

  /** Get category by ID */
  getCategoryById(id: number): Observable<CarCategory> {
    return this.http.get<CarCategory>(`${this.apiUrl}/GetById/${id}`);
  }

  /** Add new category */
  addCategory(category: Omit<CarCategory, 'id'>): Observable<CarCategory> {
    return this.http.post<CarCategory>(this.apiUrl + '/Create', category).pipe(
      tap((newCategory) => {
        this.categories.update((categories) => [...categories, newCategory]);
      })
    );
  }

  /** Update category */
  updateCategory(category: CarCategory): Observable<CarCategory> {
    return this.http.put<CarCategory>(`${this.apiUrl}/${category.id}`, category).pipe(
      tap((updatedCategory) => {
        this.categories.update((categories) =>
          categories.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
        );
      })
    );
  }

  /** Delete category */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.categories.update((categories) => categories.filter((c) => c.id !== id));
      })
    );
  }
}
