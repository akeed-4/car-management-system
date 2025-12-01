import { Injectable, signal } from '@angular/core';
import { FloorPlan } from '../types/floor-plan.model';

@Injectable({
  providedIn: 'root',
})
export class FloorPlanService {
  private floorPlans = signal<FloorPlan[]>([
    { id: 1, planName: 'تمويل مرابحة للسيارات', financier: 'بنك الراجحي', interestRate: 0.045 },
    { id: 2, planName: 'تمويل السيارات', financier: 'البنك الأهلي السعودي', interestRate: 0.052 },
    { id: 3, planName: 'تمويل شخصي', financier: 'بنك الرياض', interestRate: 0.06 },
  ]);

  public floorPlans$ = this.floorPlans.asReadonly();

  getPlanById(id: number): FloorPlan | undefined {
    return this.floorPlans().find(p => p.id === id);
  }
}
