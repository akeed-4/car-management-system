import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentCar, ConsignmentCarStatus } from '../../../types/consignment-car.model';
import { ModalComponent } from '../../shared/modal/modal.component';

type SortColumn = keyof ConsignmentCar | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-consignment-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DecimalPipe, FormsModule, ModalComponent],
  templateUrl: './consignment-list.component.html',
  styleUrl: './consignment-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentListComponent {
  private consignmentService = inject(ConsignmentService);
  private router = inject(Router);

  consignmentCars = this.consignmentService.consignmentCars$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');
  showArchived = signal(false);
  
  // Modal state for selling consignment car
  isSellModalOpen = signal(false);
  carToSell = signal<ConsignmentCar | null>(null);
  salePriceInput = signal<number>(0);

  // Modal state for deleting consignment car
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredAndSortedCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const showArchived = this.showArchived();

    let cars = this.consignmentCars().filter(car => !!car.isArchived === showArchived);

    if (searchTerm) {
      cars = cars.filter(car =>
        car.make.toLowerCase().includes(searchTerm) ||
        car.model.toLowerCase().includes(searchTerm) ||
        car.ownerName.toLowerCase().includes(searchTerm) ||
        car.status.toLowerCase().includes(searchTerm)
      );
    }

    if (column && direction) {
      cars = [...cars].sort((a, b) => {
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

    return cars;
  });

  onFilter(event: Event) {
    this.filter.set((event.target as HTMLInputElement).value);
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

  editCar(id: number): void {
    this.router.navigate(['/consignment-cars/edit', id]);
  }

  requestSell(car: ConsignmentCar): void {
    this.carToSell.set(car);
    this.salePriceInput.set(car.agreedSalePrice ?? 0); // Pre-fill with agreed price
    this.isSellModalOpen.set(true);
  }

  confirmSell(): void {
    const car = this.carToSell();
    const salePrice = this.salePriceInput();
    if (car && salePrice > 0) {
      this.consignmentService.sellConsignmentCar(car.id, salePrice);
    }
    this.closeSellModal();
  }

  closeSellModal(): void {
    this.isSellModalOpen.set(false);
    this.carToSell.set(null);
    this.salePriceInput.set(0);
  }

  requestDelete(id: number): void {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.itemToDeleteId();
    if (id) {
      // Fix: The deleteConsignmentCar method now exists in ConsignmentService.
      this.consignmentService.deleteConsignmentCar(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  archiveCar(id: number) {
    this.consignmentService.archiveConsignmentCar(id);
  }

  unarchiveCar(id: number) {
    this.consignmentService.unarchiveConsignmentCar(id);
  }
}