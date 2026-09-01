

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { Car } from '../../../models/car.model';
import { FormsModule } from '@angular/forms';
import { VinScannerComponent } from '../../shared/vin-scanner/vin-scanner.component';
import { InventoryService, CarGridRow } from '../../../services/inventory.service';
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
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

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
    SharedDataGridComponent,
    MobileCardListComponent
  ],
  templateUrl: './inventory-list.component.html',
  styleUrl: './inventory-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryListComponent {
  private inventoryService = inject(InventoryService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  /** Mobile card-list still loads the full array (small screens, no grid) -- unaffected by the
   *  desktop grid's move to server-side paging below. */
  cars = this.inventoryService.cars$;

  /** Mobile-only archived filter -- the desktop grid dropped this column/filter (see comment on
   *  showArchived below), but the mobile card list keeps it since it still reads from cars$. */
  mobileFilteredCars = computed(() => {
    const showArchived = this.showArchived();
    return this.cars().filter(car => !!car.isArchived === showArchived);
  });

  /** Server-side paged/sorted/filtered store for the desktop grid -- see
   *  InventoryService.createCarsGridStore / CarsController.GetGrid. Filtering, sorting and paging
   *  all happen in SQL now instead of over a fully-loaded in-memory array. */
  carsGridStore = this.inventoryService.createCarsGridStore();

  statusOptions = [
    { value: 'Available', text: 'متاح' },
    { value: 'Reserved', text: 'محجوز' },
    { value: 'Sold', text: 'مباع' },
    { value: 'In Maintenance', text: 'في الصيانة' }
  ];

  /** Desktop grid columns. Native DevExtreme dxi-button command columns don't render in this
   *  build (confirmed empty even in a minimal isolated grid); SharedDataGrid's Material-icon
   *  actions template is the proven working pattern (see journal-entries-list, tenant-list). */
  columns: dataGridColumnDto[] = [
    { dataField: 'vin', dataType: 'string', caption: 'INVENTORY.VIN' },
    { dataField: 'make', dataType: 'string', caption: 'INVENTORY.CAR', calculateDisplayValue: (row: CarGridRow) => this.getCarDisplayValue(row) },
    { dataField: 'salePrice', dataType: 'number', format: { type: 'currency', currency: 'SAR' }, caption: 'INVENTORY.SALE_PRICE', width: 150 },
    {
      dataField: 'status', dataType: 'string', caption: 'INVENTORY.STATUS', width: 120, alignment: 'center',
      lookup: { dataSource: this.statusOptions, valueExpr: 'value', displayExpr: 'text' },
    },
    { dataField: '__actions', dataType: 'string', caption: 'INVENTORY.ACTIONS', type: 'actions', width: 150, allowSorting: false, allowFiltering: false },
  ];

  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'INVENTORY.EDIT' },
    { id: 'label', icon: 'qr_code_2', labelKey: 'VEHICLE_LABEL.PRINT_LABEL' },
    { id: 'delete', icon: 'delete', labelKey: 'INVENTORY.DELETE' },
    { id: 'deposit', icon: 'payments', labelKey: 'INVENTORY.DEPOSIT_VOUCHER', visible: (row: CarGridRow) => row.status === 'Reserved' },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const id = (e.row as CarGridRow).id;
    if (e.actionId === 'edit') this.editCar(id);
    else if (e.actionId === 'delete') this.requestDelete(id);
    else if (e.actionId === 'deposit') this.router.navigate(['/accounts/deposits/new', id]);
    // Opened in its own tab, same convention as invoice printing -- see
    // VehicleLabelPrintComponent's auto-print-then-close behavior.
    else if (e.actionId === 'label') window.open(`/#/inventory/label/print/${id}`, '_blank');
  }

  /** Still used by the mobile card-list path (unaffected by the desktop grid's server-side move)
   *  and by the archive/unarchive actions there. */
  showArchived = signal(false);

  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  // VIN Scanner Modal state
  isScannerOpen = signal(false);
  vinScannerSearchText = signal('');

  onVinScanned(vin: string) {
    this.vinScannerSearchText.set(vin);
    this.isScannerOpen.set(false);
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
