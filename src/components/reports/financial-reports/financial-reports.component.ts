
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SalesService } from '../../../services/sales.service';
import { InventoryService } from '../../../services/inventory.service';
import { Car } from '../../../types/car.model';
import { ExpenseService } from '../../../services/expense.service';
import { FormsModule } from '@angular/forms';
import { Expense } from '../../../types/expense.model';
import { ConsignmentService } from '../../../services/consignment.service'; // Import ConsignmentService

interface ProfitDetail {
  invoiceNumber: string;
  carDescription: string;
  quantity: number;
  salePrice: number;
  costOfGoods: number; // This will be 0 for consignment sales
  profit: number; // For consignment, this is the commission
  isConsignment: boolean;
}

type SortColumn = keyof ProfitDetail | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './financial-reports.component.html',
  styleUrl: './financial-reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialReportsComponent {
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private expenseService = inject(ExpenseService);
  private consignmentService = inject(ConsignmentService); // Inject ConsignmentService

  private salesInvoices = this.salesService.invoices$;
  private allCars = this.inventoryService.cars$;
  private allExpenses = this.expenseService.expenses$;
  private allConsignmentCars = this.consignmentService.consignmentCars$; // Get all consignment cars

  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('asc'); // Default to 'asc' for consistency

  private carsMap = computed(() => new Map(this.allCars().map(c => [c.id, c])));
  private consignmentCarsMap = computed(() => new Map(this.allConsignmentCars().map(c => [c.id, c])));

  private expensesByCar = computed(() => {
    const map = new Map<number, Expense[]>();
    for (const expense of this.allExpenses()) {
      if (expense.carId) {
        if (!map.has(expense.carId)) {
          map.set(expense.carId, []);
        }
        map.get(expense.carId)!.push(expense);
      }
    }
    return map;
  });

  detailedProfitReport = computed<ProfitDetail[]>(() => {
    const report: ProfitDetail[] = [];
    const carMap = this.carsMap();
    const consignmentCarMap = this.consignmentCarsMap();
    const expenseMap = this.expensesByCar();

    // Process regular sales invoices
    for (const invoice of this.salesInvoices()) {
      for (const item of invoice.items) {
        const car = carMap.get(item.carId);
        if (!car) continue;

        const associatedExpenses = expenseMap.get(item.carId) ?? [];
        const associatedExpensesTotal = associatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // True cost = purchase price + initial additional costs + all linked maintenance/other expenses
        const costOfGoods = (car.purchasePrice + car.additionalCosts + associatedExpensesTotal) * item.quantity;
        
        report.push({
          invoiceNumber: invoice.invoiceNumber,
          carDescription: item.carDescription,
          quantity: item.quantity,
          salePrice: item.lineTotal,
          costOfGoods: costOfGoods,
          profit: item.lineTotal - costOfGoods,
          isConsignment: false,
        });
      }
    }

    // Process consignment car sales
    for (const consignmentCar of this.allConsignmentCars()) {
      if (consignmentCar.status === 'Sold' && consignmentCar.salePrice && consignmentCar.commissionAmount) {
        report.push({
          invoiceNumber: `CON-${consignmentCar.id}`, // Unique identifier for consignment sale
          carDescription: `${consignmentCar.make} ${consignmentCar.model} (عهدة)`,
          quantity: 1,
          salePrice: consignmentCar.salePrice,
          costOfGoods: 0, // Consignment cars don't have a direct "cost of goods" for the dealership
          profit: consignmentCar.commissionAmount, // Profit is the commission
          isConsignment: true,
        });
      }
    }

    return report;
  });

  filteredAndSortedProfitReport = computed(() => {
    let report = this.detailedProfitReport();
    const searchTerm = this.filter().toLowerCase();
    
    if (searchTerm) {
      report = report.filter(item => 
        item.invoiceNumber.toLowerCase().includes(searchTerm) ||
        item.carDescription.toLowerCase().includes(searchTerm)
      );
    }

    const column = this.sortColumn();
    const direction = this.sortDirection();
    if (column && direction) {
      report = [...report].sort((a, b) => {
        const aValue = a[column];
        const bValue = b[column];
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }
    return report;
  });

  totalRevenue = computed(() => 
    this.filteredAndSortedProfitReport().reduce((sum, item) => sum + item.salePrice, 0)
  );

  totalCostOfGoodsSold = computed(() => 
    this.filteredAndSortedProfitReport().filter(item => !item.isConsignment).reduce((sum, item) => sum + item.costOfGoods, 0)
  );
  
  totalConsignmentCommission = computed(() => 
    this.filteredAndSortedProfitReport().filter(item => item.isConsignment).reduce((sum, item) => sum + item.profit, 0)
  );

  grossProfit = computed(() => this.totalRevenue() - this.totalCostOfGoodsSold());

  // Operating Expenses are now only those NOT linked to a car
  totalOperatingExpenses = computed(() => 
    this.allExpenses()
      .filter(expense => !expense.carId)
      .reduce((sum, expense) => sum + expense.amount, 0)
  );

  netProfit = computed(() => (this.grossProfit() + this.totalConsignmentCommission()) - this.totalOperatingExpenses());

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }
}
