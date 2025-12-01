
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { InventoryService } from '../../services/inventory.service';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { SalesService } from '../../services/sales.service';
import { BarChartComponent } from '../shared/bar-chart/bar-chart.component';
import { PieChartComponent } from '../shared/pie-chart/pie-chart.component';
import { RequestedCarService } from '../../services/requested-car.service';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../services/expense.service';
import { Car, CarStatus } from '../../types/car.model';
import { AlertsService } from '../../services/alerts.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, SlicePipe, BarChartComponent, PieChartComponent, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private inventoryService = inject(InventoryService);
  private salesService = inject(SalesService);
  // Fix: Explicitly type the injected service to resolve 'unknown' type inference issue.
  private requestedCarService: RequestedCarService = inject(RequestedCarService);
  private expenseService = inject(ExpenseService);
  private alertsService = inject(AlertsService);
  
  // Access cars and quantities separately
  cars = this.inventoryService.cars$;
  carQuantities = this.inventoryService.carQuantities$; // Access car quantities
  upcomingAlerts = this.alertsService.upcomingAlerts$;
  
  availableCarsCount = computed(() => {
    let count = 0;
    const quantities = this.carQuantities();
    for (const [carId, quantity] of quantities.entries()) {
      const car = this.cars().find(c => c.id === carId);
      if (car?.status === 'Available') {
        count += quantity;
      }
    }
    return count;
  });

  requestedCarsCount = computed(() => this.requestedCarService.requestedCars$().length);
  
  soldCarsCount = computed(() => this.salesService.invoices$().reduce((sum, inv) => inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0) + sum ,0));
  
  totalInventoryValue = computed(() => {
    let value = 0;
    const quantities = this.carQuantities();
    for (const [carId, quantity] of quantities.entries()) {
      const car = this.cars().find(c => c.id === carId);
      if (car) {
        value += car.totalCost * quantity;
      }
    }
    return value;
  });
  
  // New computed signal for total expenses
  totalExpenses = computed(() => this.expenseService.expenses$().reduce((sum, expense) => sum + expense.amount, 0));


  salesByManufacturer = computed(() => {
    const sales = this.salesService.invoices$();
    const cars = this.inventoryService.cars$();
    
    const salesData = new Map<string, number>();

    for (const sale of sales) {
      for (const item of sale.items) {
        const car = cars.find(c => c.id === item.carId);
        if (car) {
          const currentSales = salesData.get(car.make) || 0;
          salesData.set(car.make, currentSales + item.lineTotal);
        }
      }
    }

    return Array.from(salesData.entries()).map(([name, value]) => ({ name, value }));
  });

  inventoryStatusDistribution = computed(() => {
    const quantities = this.carQuantities();
    const cars = this.cars();
    const statusCounts = new Map<CarStatus, number>();

    for (const [carId, quantity] of quantities.entries()) {
      const car = cars.find(c => c.id === carId);
      if (car && quantity > 0) { // Only count if there's stock
        const currentCount = statusCounts.get(car.status) || 0;
        statusCounts.set(car.status, currentCount + quantity);
      } else if (car && car.status === 'Sold' && quantity === 0) {
        // Explicitly handle sold cars with 0 quantity if needed for reporting,
        // though typically `soldCarsCount` handles this.
        const currentCount = statusCounts.get(car.status) || 0;
        statusCounts.set(car.status, currentCount + quantity); // Will add 0 if quantity is 0
      }
    }

    // Ensure all possible statuses are represented for chart consistency, even if 0
    const allStatuses: CarStatus[] = ['Available', 'Reserved', 'Sold', 'In Maintenance'];
    const finalDistribution = allStatuses
        .map(status => ({
            name: status,
            value: statusCounts.get(status) ?? 0
        }))
        .filter(entry => entry.value > 0); // Filter out entries with 0 value for cleaner chart

    return finalDistribution;
  });
}
