

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Car, CarCondition, CarLocation } from '../../../models/car.model';
import { FormsModule } from '@angular/forms'; // Import FormsModule for filter input
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { InventoryService } from '../../../services/inventory.service';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

type SortColumn = keyof Car | '';
type SortDirection = 'asc' | 'desc' | '';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ModalComponent,
    FormsModule,
    VinScannerComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    MobileCardListComponent
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  // Fix: Injected Router service
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  cars = this.inventoryService.cars$;
  filter = signal('');
  sortColumn = signal<SortColumn>('');
  sortDirection = signal<SortDirection>('');
  showArchived = signal(false);
  conditionFilter = signal<'All' | 'New' | 'Used'>('All');

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  // VIN Scanner Modal state
  isScannerOpen = signal(false);

  // DataGrid options
  statusOptions = [
    { value: 'Available', display: 'متاح' },
    { value: 'Reserved', display: 'محجوز' },
    { value: 'Sold', display: 'مباع' },
    { value: 'In Maintenance', display: 'في الصيانة' }
  ];
  
  filteredAndSortedCars = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const column = this.sortColumn();
    const direction = this.sortDirection();
    const showArchived = this.showArchived();
    const condition = this.conditionFilter();

    let cars = this.cars().filter(car => !!car.isArchived === showArchived);

    // Filter by Condition
    if (condition !== 'All') {
      cars = cars.filter(car => car.condition === condition);
    }
    
    // Filter by Search Term
    if (searchTerm) {
      cars = cars.filter(car => 
        car.make.toLowerCase().includes(searchTerm) ||
        car.model.toLowerCase().includes(searchTerm) ||
        car.year.toString().includes(searchTerm) ||
        car.vin.toLowerCase().includes(searchTerm) ||
        car.status.toLowerCase().includes(searchTerm) ||
        car.currentLocation.toLowerCase().includes(searchTerm)
      );
    }

    // Sort
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
  
  setConditionFilter(filter: 'All' | 'New' | 'Used') {
    this.conditionFilter.set(filter);
  }

  onFilter(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filter.set(input.value);
  }
  
  onVinScanned(vin: string) {
    this.filter.set(vin);
    this.isScannerOpen.set(false);
  }

  onLocationChange(carId: number, event: Event) {
    this.inventoryService.updateCarLocation(carId, (event.target as HTMLInputElement).value);
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

  editCar(id: number) {
    this.router.navigate(['/inventory/edit', id]);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    const id = this.itemToDeleteId();
    if (id) {
      this.inventoryService.deleteCar(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }

  archiveCar(id: number) {
    this.inventoryService.archiveCar(id);
  }

  unarchiveCar(id: number) {
    this.inventoryService.unarchiveCar(id);
  }

  // DataGrid action methods
  onEditClick = (e: any) => {
    this.editCar(e.row.data.id);
  };

  onDeleteClick = (e: any) => {
    this.requestDelete(e.row.data.id);
  };

  onArchiveClick = (e: any) => {
    this.archiveCar(e.row.data.id);
  };

  onUnarchiveClick = (e: any) => {
    this.unarchiveCar(e.row.data.id);
  };

  onDepositClick = (e: any) => {
    this.router.navigate(['/accounts/deposits/new', e.row.data.id]);
  };

  onRowUpdated = (e: any) => {
    if (e.key && e.newData.currentLocation !== undefined) {
      this.inventoryService.updateCarLocation(e.key, e.newData.currentLocation);
    }
  };

  // Visibility functions for DataGrid buttons
  isEditVisible = (e: any) => {
    return !this.showArchived();
  };

  isDeleteVisible = (e: any) => {
    return !this.showArchived();
  };

  isArchiveVisible = (e: any) => {
    return !this.showArchived() && e.row.data.status === 'Sold';
  };

  isUnarchiveVisible = (e: any) => {
    return this.showArchived();
  };

  isDepositVisible = (e: any) => {
    return !this.showArchived() && e.row.data.status === 'Reserved';
  };

  // Custom display functions
  getCarDisplayValue = (rowData: any) => {
    return `${rowData.make} ${rowData.model} (${rowData.year})`;
  };

  getStatusDisplayValue = (rowData: any) => {
    const statusMap: { [key: string]: string } = {
      'Available': 'متاح',
      'Reserved': 'محجوز',
      'Sold': 'مباع',
      'In Maintenance': 'في الصيانة'
    };
    return statusMap[rowData.status] || rowData.status;
  };

  getConditionDisplayValue = (rowData: any) => {
    return rowData.condition === 'New' ? 'جديدة' : 'مستعملة';
  };

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: Car) => this.getCarDisplayValue(item);
  mobileTrackBy = (_index: number, item: Car) => item.id;

  mobileFields: MobileCardField<Car>[] = [
    { label: 'INVENTORY.VIN', value: (item) => item.vin },
    { label: 'INVENTORY.SALE_PRICE', value: (item) => item.salePrice },
    { label: 'INVENTORY.STATUS', value: (item) => this.getStatusDisplayValue(item) },
    { label: 'INVENTORY.CURRENT_LOCATION', value: (item) => item.currentLocation },
  ];

  // Mirrors the desktop grid's isEditVisible/isDeleteVisible/isArchiveVisible/
  // isUnarchiveVisible/isDepositVisible guards, which only read
  // showArchived()/row status -- adapted here to take the Car directly
  // instead of a DevExtreme `{row:{data:...}}` event.
  mobileIsEditVisible = (item: Car) => !this.showArchived();
  mobileIsDeleteVisible = (item: Car) => !this.showArchived();
  mobileIsArchiveVisible = (item: Car) => !this.showArchived() && item.status === 'Sold';
  mobileIsUnarchiveVisible = (item: Car) => this.showArchived();
  mobileIsDepositVisible = (item: Car) => !this.showArchived() && item.status === 'Reserved';

  mobileEdit(item: Car): void {
    this.editCar(item.id);
  }

  mobileDelete(item: Car): void {
    this.requestDelete(item.id);
  }

  mobileArchive(item: Car): void {
    this.archiveCar(item.id);
  }

  mobileUnarchive(item: Car): void {
    this.unarchiveCar(item.id);
  }

  mobileDeposit(item: Car): void {
    this.router.navigate(['/accounts/deposits/new', item.id]);
  }
}
