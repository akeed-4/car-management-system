import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { InventoryService } from '../../../services/inventory.service';
import { FloorPlanService } from '../../../services/floor-plan.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FloorPlan } from '../../../models/floor-plan.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DxDataGridModule, DxTemplateModule, DxTemplateHost } from 'devextreme-angular';

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
  imports: [
    TranslateModule,
    CurrencyPipe,
    MatCardModule,
    CommonModule,
    MatToolbarModule,
    DxDataGridModule,
    DxTemplateModule
  ],
  providers: [DxTemplateHost],
  templateUrl: './floor-plan-report.component.html',
  styleUrl: './floor-plan-report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloorPlanReportComponent {
  private inventoryService = inject(InventoryService);
  private floorPlanService = inject(FloorPlanService);
  translate = inject(TranslateService);

  private allCars = this.inventoryService.cars$;
  private allPlans = this.floorPlanService.floorPlans$;
  
  financedCarsReport = computed<FinancedCarReportItem[]>(() => {
    const cars = this.allCars().filter(c => c.floorPlanId && c.purchaseDate && (c.status === 'Available' || c.status === 'Reserved'));
    // Fix: Explicitly type the Map to help TypeScript infer the value type correctly.
    const plansMap = new Map<number, FloorPlan>(this.allPlans().map(p => [p.id, p]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return cars.map(car => {
      const plan = plansMap.get(car.floorPlanId!);
      const purchaseDate = new Date(car.purchaseDate!);
      const timeDiff = today.getTime() - purchaseDate.getTime();
      const daysInStock = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      

      // Use annualInterestRate from FloorPlan model
      const dailyInterest = (car.purchasePrice * (plan?.annualInterestRate ?? 0)) / 365;
      const accruedCost = dailyInterest * daysInStock;

      return {
        carId: car.id,
        carDescription: `${car.make} ${car.model} (${car.year})`,
        purchasePrice: car.purchasePrice,
        purchaseDate: car.purchaseDate!,
        planName: (plan as any)?.planName ?? 'N/A', // fallback, not in model
        financier: (plan as any)?.financier ?? 'N/A', // fallback, not in model
        interestRate: plan?.annualInterestRate ?? 0,
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
