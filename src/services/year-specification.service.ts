import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CreateYearSpecification, YearSpecification } from '../models/year-specification.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class YearSpecificationService {
  private apiUrl = environment.origin + 'api/YearSpecifications';

  private specs = signal<YearSpecification[]>([]);
  public specs$ = this.specs.asReadonly();

  constructor(private http: HttpClient) {
    this.loadAll();
  }

  loadAll(): void {
    this.http.get<YearSpecification[]>(this.apiUrl + '/GetAll').subscribe({
      next: (data) => this.specs.set(data),
      error: (error) => console.error('Failed to load year specifications', error),
    });
  }

  getById(id: number): Observable<YearSpecification> {
    return this.http.get<YearSpecification>(`${this.apiUrl}/GetById/${id}`);
  }

  /** Cascading lookup: the Year Specifications belonging to one Trim, for the
   *  Trim -> Year Specification dropdown on the Vehicle Add/Edit screen. */
  getByTrimId(trimId: number): Observable<YearSpecification[]> {
    return this.http.get<YearSpecification[]>(`${this.apiUrl}/GetByTrim/${trimId}`);
  }

  create(dto: CreateYearSpecification): Observable<YearSpecification> {
    return this.http.post<YearSpecification>(this.apiUrl + '/Create', dto).pipe(
      tap((created) => this.specs.update((list) => [...list, created]))
    );
  }

  update(id: number, dto: Partial<CreateYearSpecification>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/Update/${id}`, dto).pipe(
      tap(() => this.loadAll())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`).pipe(
      tap(() => this.specs.update((list) => list.filter((s) => s.id !== id)))
    );
  }
}
