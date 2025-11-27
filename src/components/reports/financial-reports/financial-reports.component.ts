import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SalesService } from '../../../services/sales.service';
import { InventoryService } from '../../../services/inventory.service';
import { Car } from '../../../types/car.model';
// Corrected the relative import path for ExpenseService
import { ExpenseService } from '../../../services/expense.service';
import { FormsModule } from '@angular/forms'; // Import FormsModule for filter input

interface ProfitDetail {
  invoiceNumber: string;
  carDescription: string;
  quantity: number;
  salePrice: number;
  costOfGoods: number;
  profit: number;
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
  private expenseService = inject(ExpenseService); // Inject ExpenseService

  private salesInvoices = this.salesService.invoices$;
  private allCars = this.inventoryService.cars$;
  private allExpenses = this.expenseService.expenses$; // Get all expenses

  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');

  // Create a map for quick car lookup
  private carsMap = computed(() => {
    const map = new Map<number, Car>();
    // The inventory service provides a snapshot of the *current* state.
    // To get historical cost, you'd typically need a transaction log or snapshot.
    // For this simulation, we'll use the current cost from inventory.
    for (const car of this.allCars()) {
      map.set(car.id, car);
    }
    return map;
  });

  detailedProfitReport = computed<ProfitDetail[]>(() => {
    const report: ProfitDetail[] = [];
    // Fix: Corrected accessing the Map value from the carsMap computed signal
    const carMap = this.carsMap(); 
    for (const invoice of this.salesInvoices()) {
      for (const item of invoice.items) {
        // Find the original car data to get its cost.
        // In a real system, you'd store the cost at the time of sale.
        const car = carMap.get(item.carId);
        // Assuming totalCost on car model includes purchase price + additional costs from procurement
        const costOfGoods = car ? car.totalCost * item.quantity : 0; 
        report.push({
          invoiceNumber: invoice.invoiceNumber,
          carDescription: item.carDescription,
          quantity: item.quantity,
          salePrice: item.lineTotal,
          costOfGoods: costOfGoods,
          profit: item.lineTotal - costOfGoods,
        });
      }
    }
    return report;
  });

  filteredAndSortedProfitReport = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    let report = this.detailedProfitReport();

    // Filter
    if (searchTerm) {
      report = report.filter(item => 
        item.invoiceNumber.toLowerCase().includes(searchTerm) ||
        item.carDescription.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      report = [...report].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (column === 'invoiceNumber' || column === 'carDescription') {
          aValue = a[column];
          bValue = b[column];
        } else if (column === 'salePrice' || column === 'costOfGoods' || column === 'profit' || column === 'quantity') {
          aValue = a[column];
          bValue = b[column];
        } else {
          aValue = a[column];
          bValue = b[column];
        }

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
    this.filteredAndSortedProfitReport().reduce((sum, item) => sum + item.costOfGoods, 0)
  );

  grossProfit = computed(() => this.totalRevenue() - this.totalCostOfGoodsSold());

  // New: Total Operating Expenses
  totalOperatingExpenses = computed(() => 
    this.allExpenses().reduce((sum, expense) => sum + expense.amount, 0)
  );

  // New: Net Profit
  netProfit = computed(() => this.grossProfit() - this.totalOperatingExpenses());

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    if (this.sortDirection() === 'asc') return '▲';
    if (this.sortDirection() === 'desc') return '▼';
    return '';
  }
}