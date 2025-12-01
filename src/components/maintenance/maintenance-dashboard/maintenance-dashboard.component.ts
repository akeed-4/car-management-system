

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ServiceOrder, ServiceOrderStatus } from '../../../types/service-order.model';
import { ServiceOrderService } from '../../../services/service-order.service';

type SortColumn = keyof ServiceOrder | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-maintenance-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe],
  templateUrl: './maintenance-dashboard.component.html',
  styleUrl: './maintenance-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceDashboardComponent {
  private serviceOrderService = inject(ServiceOrderService);

  allServiceOrders = this.serviceOrderService.serviceOrders$;
  filter = signal('');
  sortColumn = signal<SortColumn>('dateIn');
  sortDirection = signal<SortDirection>('desc');
  statusFilter = signal<ServiceOrderStatus | 'All'>('All');

  filteredAndSortedOrders = computed(() => {
    let orders = this.allServiceOrders();
    const searchTerm = this.filter().toLowerCase();
    const currentStatusFilter = this.statusFilter();
    const column = this.sortColumn();
    const direction = this.sortDirection();

    // Filter by status
    if (currentStatusFilter !== 'All') {
      orders = orders.filter(order => order.status === currentStatusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      orders = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm) ||
        order.carDescription?.toLowerCase().includes(searchTerm) ||
        order.notes?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
    if (column && direction) {
      orders = [...orders].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (column === 'dateIn' || column === 'dateOut') {
          aValue = new Date(a[column] as string).getTime();
          bValue = new Date(b[column] as string).getTime();
        } else if (column === 'customerName' || column === 'carDescription' || column === 'orderNumber') {
          aValue = (a[column] as string) || '';
          bValue = (b[column] as string) || '';
        } else if (column === 'totalCost') {
          aValue = a.totalCost;
          bValue = b.totalCost;
        } else if (column === 'status') {
          aValue = a.status;
          bValue = b.status;
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

    return orders;
  });

  setStatusFilter(status: ServiceOrderStatus | 'All') {
    this.statusFilter.set(status);
  }

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  onSort(column: SortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: SortColumn) {
    if (this.sortColumn() !== column) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  updateOrderStatus(order: ServiceOrder, newStatus: ServiceOrderStatus) {
    if (order.status === newStatus) return; // No change
    const updatedOrder = { ...order, status: newStatus, dateOut: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : order.dateOut };
    this.serviceOrderService.updateServiceOrder(updatedOrder);
  }
}
    