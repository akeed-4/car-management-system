import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { ConsignmentService } from '../../../services/consignment.service';
import { ConsignmentCar, ConsignmentCarStatus } from '../../../models/consignment-car.model';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TranslateModule } from '@ngx-translate/core';

type SortColumn = keyof ConsignmentCar | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-consignment-list',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    DxDataGridModule,
    DxButtonModule,
    ModalComponent,
    TranslateModule
  ],
  templateUrl: './consignment-list.component.html',
  styleUrl: './consignment-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsignmentListComponent {
  private consignmentService = inject(ConsignmentService);
  private router = inject(Router);

  consignmentCars = this.consignmentService.consignmentCars$;
  filter = signal('');
  showArchived = signal(false);
  
  // Modal state for selling consignment car
  isSellModalOpen = signal(false);
  carToSell = signal<ConsignmentCar | null>(null);
  salePriceInput = signal<number>(0);

  // Modal state for deleting consignment car
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  filteredCars = computed(() => {
    const showArchived = this.showArchived();
    return this.consignmentCars().filter(car => !!car.isArchived === showArchived);
  });

  statusOptions = [
    { value: 'Available', display: 'متاحة للبيع' },
    { value: 'Sold', display: 'مباعة' },
    { value: 'Returned to Owner', display: 'تم إعادتها' }
  ];

  getCarDisplayValue = (rowData: ConsignmentCar) => `${rowData.make} ${rowData.model} (${rowData.year})`;

  getOwnerDisplayValue = (rowData: ConsignmentCar) => `${rowData.ownerName}\n${rowData.ownerPhone}`;

  getStatusDisplayValue = (rowData: ConsignmentCar) => {
    switch (rowData.status) {
      case 'Available': return 'متاحة للبيع';
      case 'Sold': return 'مباعة';
      case 'Returned to Owner': return 'تم إعادتها';
      default: return rowData.status;
    }
  };

  editCar = (rowData: ConsignmentCar) => {
    this.router.navigate(['/consignment-cars/edit', rowData.id]);
  };

  requestSell = (rowData: ConsignmentCar) => {
    this.carToSell.set(rowData);
    this.salePriceInput.set(rowData.agreedSalePrice ?? 0);
    this.isSellModalOpen.set(true);
  };

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

  requestDelete = (rowData: ConsignmentCar) => {
    this.itemToDeleteId.set(rowData.id);
    this.isDeleteModalOpen.set(true);
  };

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

  archiveCar = (rowData: ConsignmentCar) => {
    this.consignmentService.archiveConsignmentCar(rowData.id);
  };

  unarchiveCar = (rowData: ConsignmentCar) => {
    this.consignmentService.unarchiveConsignmentCar(rowData.id);
  };

  // Button visibility functions for DevExtreme DataGrid
  getSellButtonVisible = (rowData: ConsignmentCar) => {
    return !this.showArchived() && rowData.status === 'Available';
  };

  getEditButtonVisible = (rowData: ConsignmentCar) => {
    return !this.showArchived() && rowData.status === 'Available';
  };

  getDeleteButtonVisible = (rowData: ConsignmentCar) => {
    return !this.showArchived() && rowData.status === 'Available';
  };

  getArchiveButtonVisible = (rowData: ConsignmentCar) => {
    return !this.showArchived() && rowData.status !== 'Available';
  };

  getUnarchiveButtonVisible = (rowData: ConsignmentCar) => {
    return this.showArchived();
  };
}