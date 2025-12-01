import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FloorPlan } from '../../../types/floor-plan.model';

interface FinancedCarReportItem {
  carId: number;
  carDescription: string;
  purchasePrice: number;
  purchaseDate: string;
  planName: string;
  financier: string;
  interestRate: number;
  daysInStock: number;
  accruedCost: number;
}

@Component({
  selector: 'app-floor-plan-report',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './floor-plan-report.component.html',
  styleUrl: './floor-plan-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloorPlanReportComponent {
  private inventoryService = inject(InventoryService);
  private floorPlanService = inject(FloorPlanService);

  private allCars = this.inventoryService.cars$;
  private allPlans = this.floorPlanService.floorPlans$;
  
  financedCarsReport = computed<FinancedCarReportItem[]>(() => {
    const cars = this.allCars().filter(c => c.floorPlanId && (c.status === 'Available' || c.status === 'Reserved'));
    // Fix: Explicitly type the Map to help TypeScript infer the value type correctly.
    const plansMap = new Map<number, FloorPlan>(this.allPlans().map(p => [p.id, p]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cars.map(car => {
      const plan = plansMap.get(car.floorPlanId!);
      const purchaseDate = new Date(car.purchaseDate!);
      const timeDiff = today.getTime() - purchaseDate.getTime();
      const daysInStock = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      
      const dailyInterest = (car.purchasePrice * (plan?.interestRate ?? 0)) / 365;
      const accruedCost = dailyInterest * daysInStock;

      return {
        carId: car.id,
        carDescription: `${car.make} ${car.model} (${car.year})`,
        purchasePrice: car.purchasePrice,
        purchaseDate: car.purchaseDate!,
        planName: plan?.planName ?? 'N/A',
        financier: plan?.financier ?? 'N/A',
        interestRate: plan?.interestRate ?? 0,
        daysInStock: daysInStock,
        accruedCost: accruedCost,
      };
    }).sort((a,b) => b.daysInStock - a.daysInStock);
  });

  totalFinancedValue = computed(() => 
    this.financedCarsReport().reduce((sum, car) => sum + car.purchasePrice, 0)
  );
  
  totalAccruedCost = computed(() =>
    this.financedCarsReport().reduce((sum, car) => sum + car.accruedCost, 0)
  );

}
