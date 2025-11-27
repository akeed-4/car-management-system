import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SalesService } from '../../../services/sales.service';
import { FormsModule } from '@angular/forms';
import { SalesInvoice } from '../../../types/sales-invoice.model';

interface BestSeller {
  description: string;
  quantitySold: number;
}

interface TopSalesperson {
  name: string;
  totalSales: number;
}

type SalespersonSortColumn = keyof TopSalesperson | '';
type BestSellerSortColumn = keyof BestSeller | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-administrative-reports',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './administrative-reports.component.html',
  styleUrl: './administrative-reports.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeReportsComponent {
  private salesService = inject(SalesService);
  private invoices = this.salesService.invoices$;

  // Filter & Sort for Best Selling Cars
  bestSellerFilter = signal('');
  bestSellerSortColumn = signal<BestSellerSortColumn>('quantitySold');
  bestSellerSortDirection = signal<SortDirection>('desc');

  // Filter & Sort for Top Salespeople
  salespersonFilter = signal('');
  salespersonSortColumn = signal<SalespersonSortColumn>('totalSales');
  salespersonSortDirection = signal<SortDirection>('desc');


  bestSellingCars = computed<BestSeller[]>(() => {
    const carSales = new Map<string, number>();
    for (const invoice of this.invoices()) {
      for (const item of invoice.items) {
        const currentQty = carSales.get(item.carDescription) || 0;
        carSales.set(item.carDescription, currentQty + item.quantity);
      }
    }
    let data = Array.from(carSales.entries())
      .map(([description, quantitySold]) => ({ description, quantitySold }));

    // Filter
    const searchTerm = this.bestSellerFilter().toLowerCase();
    if (searchTerm) {
      data = data.filter(car => car.description.toLowerCase().includes(searchTerm));
    }

    // Sort
    const column = this.bestSellerSortColumn();
    const direction = this.bestSellerSortDirection();
    if (column && direction) {
      data = [...data].sort((a, b) => {
        let comparison = 0;
        if (column === 'description') {
          comparison = a.description.localeCompare(b.description);
        } else if (column === 'quantitySold') {
          comparison = a.quantitySold - b.quantitySold;
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  });

  topSalespeople = computed<TopSalesperson[]>(() => {
    const salesByPerson = new Map<string, number>();
    for (const invoice of this.invoices()) {
      if (invoice.salesperson) {
        const currentSales = salesByPerson.get(invoice.salesperson) || 0;
        salesByPerson.set(invoice.salesperson, currentSales + invoice.totalAmount);
      }
    }
    let data = Array.from(salesByPerson.entries())
      .map(([name, totalSales]) => ({ name, totalSales }));
    
    // Filter
    const searchTerm = this.salespersonFilter().toLowerCase();
    if (searchTerm) {
      data = data.filter(person => person.name.toLowerCase().includes(searchTerm));
    }

    // Sort
    const column = this.salespersonSortColumn();
    const direction = this.salespersonSortDirection();
    if (column && direction) {
      data = [...data].sort((a, b) => {
        let comparison = 0;
        if (column === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (column === 'totalSales') {
          comparison = a.totalSales - b.totalSales;
        }
        return direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  });

  onBestSellerFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.bestSellerFilter.set(input.value);
  }

  onBestSellerSort(column: BestSellerSortColumn) {
    if (this.bestSellerSortColumn() === column) {
      this.bestSellerSortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.bestSellerSortColumn.set(column);
      this.bestSellerSortDirection.set('asc');
    }
  }

  getBestSellerSortIcon(column: BestSellerSortColumn) {
    if (this.bestSellerSortColumn() !== column) return '';
    if (this.bestSellerSortDirection() === 'asc') return '▲';
    if (this.bestSellerSortDirection() === 'desc') return '▼';
    return '';
  }

  onSalespersonFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.salespersonFilter.set(input.value);
  }

  onSalespersonSort(column: SalespersonSortColumn) {
    if (this.salespersonSortColumn() === column) {
      this.salespersonSortDirection.update(currentDir => {
        if (currentDir === 'asc') return 'desc';
        if (currentDir === 'desc') return '';
        return 'asc';
      });
    } else {
      this.salespersonSortColumn.set(column);
      this.salespersonSortDirection.set('asc');
    }
  }

  getSalespersonSortIcon(column: SalespersonSortColumn) {
    if (this.salespersonSortColumn() !== column) return '';
    if (this.salespersonSortDirection() === 'asc') return '▲';
    if (this.salespersonSortDirection() === 'desc') return '▼';
    return '';
  }
}