import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { FloorPlan } from '../types/floor-plan.model';

@Injectable({
  providedIn: 'root',
})
export class FloorPlanService {
  private apiUrl = 'http://localhost:5294/api/floorplans';

  private floorPlans = signal<FloorPlan[]>([]);
  public floorPlans$ = this.floorPlans.asReadonly();

  constructor(private http: HttpClient) {
    this.loadFloorPlans();
  }

  /** Load all floor plans from API */
  loadFloorPlans() {
    this.http.get<FloorPlan[]>(this.apiUrl)
      .pipe(tap(plans => this.floorPlans.set(plans)))
      .subscribe();
  }

  /** Get single floor plan by ID */
  getPlanById(id: number): FloorPlan | undefined {
    return this.floorPlans().find(p => p.id === id);
  }

  /** Add a new floor plan */
  addFloorPlan(plan: Omit<FloorPlan, 'id'>) {
    this.http.post<FloorPlan>(this.apiUrl, plan)
      .pipe(
        tap(newPlan => {
          this.floorPlans.update(list => [...list, newPlan]);
        })
      )
      .subscribe();
  }

  /** Update existing floor plan */
  updateFloorPlan(plan: FloorPlan) {
    const url = `${this.apiUrl}/${plan.id}`;
    this.http.put<FloorPlan>(url, plan)
      .pipe(
        tap(updated => {
          this.floorPlans.update(list =>
            list.map(p => (p.id === updated.id ? updated : p))
          );
        })
      )
      .subscribe();
  }

  /** Delete floor plan */
  deleteFloorPlan(id: number) {
    const url = `${this.apiUrl}/${id}`;
    this.http.delete(url)
      .pipe(
        tap(() => {
          this.floorPlans.update(list => list.filter(p => p.id !== id));
        })
      )
      .subscribe();
  }
}
