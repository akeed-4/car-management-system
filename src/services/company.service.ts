import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Company } from '../types/branch.model';
import { environment } from '../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = environment.origin + 'api/Companies';

  private companies = signal<Company[]>([]);
  public companies$ = this.companies.asReadonly();

  constructor(private http: HttpClient) {
    this.loadCompanies();
  }

  /** Load companies from API */
  loadCompanies() {
    this.http.get<Company[]>(`${this.apiUrl}/GetAll`).subscribe({
      next: (data) => {
        this.companies.set(data);
        console.log('Companies loaded', data);
      },
      error: (error) => {
        console.error('Failed to load companies', error);
      }
    });
  }

  // Get all companies with optional paging/sorting
  getAll(params?: any): Observable<Company[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Company[]>(`${this.apiUrl}/GetAll`, { params: httpParams }).pipe(
      tap(data => this.companies.set(data))
    );
  }

  // Get company by ID
  getById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/GetById/${id}`);
  }

  // Create new company
  create(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Observable<Company> {
    // Transform the company object to match API expectations
    const apiPayload = {
      ...company,
      name: typeof company.name === 'object' ? company.name.en : company.name // Extract English name as string
    };
    return this.http.post<Company>(`${this.apiUrl}/Create`, apiPayload);
  }

  // Update existing company
  update(id: number, company: Partial<Company>): Observable<Company> {
    // Transform the company object to match API expectations
    const apiPayload = {
      ...company,
      name: typeof company.name === 'object' ? company.name.en : company.name // Extract English name as string
    };
    return this.http.put<Company>(`${this.apiUrl}/Update/${id}`, apiPayload);
  }

  // Delete company
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}