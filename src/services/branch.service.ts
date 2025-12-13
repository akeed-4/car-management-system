import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Branch } from '../types/branch.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BranchService {
  private apiUrl = environment.origin + 'api/Branches';

  private branches = signal<Branch[]>([]);
  public branches$ = this.branches.asReadonly();

  constructor(private http: HttpClient) {
    this.loadBranches();
  }

  /** Load branches from API */
  loadBranches() {
    this.http.get<Branch[]>(`${this.apiUrl}/GetAll`).subscribe({
      next: (data) => {
        this.branches.set(data);
        console.log('Branches loaded', data);
      },
      error: (error) => {
        console.error('Failed to load branches', error);
      }
    });
  }

  // Get all branches with optional paging/sorting
  getAll(params?: any): Observable<Branch[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    return this.http.get<Branch[]>(`${this.apiUrl}/GetAll`, { params: httpParams }).pipe(
      tap(data => this.branches.set(data))
    );
  }

  // Get branch by ID
  getById(id: number): Observable<Branch> {
    return this.http.get<Branch>(`${this.apiUrl}/GetById/${id}`);
  }

  // Create new branch
  create(branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Observable<Branch> {
    // Transform the branch object to match API expectations
    const apiPayload = {
      ...branch,
      name: typeof branch.name === 'object' ? branch.name.en : branch.name // Extract English name as string
    };
    return this.http.post<Branch>(`${this.apiUrl}/Create`, apiPayload);
  }

  // Update existing branch
  update(id: number, branch: Partial<Branch>): Observable<Branch> {
    // Transform the branch object to match API expectations
    const apiPayload = {
      ...branch,
      name: typeof branch.name === 'object' ? branch.name.en : branch.name // Extract English name if it's an object
    };
    return this.http.put<Branch>(`${this.apiUrl}/Update/${id}`, apiPayload);
  }

  // Delete branch
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}