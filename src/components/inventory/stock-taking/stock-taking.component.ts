import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { StockTakeService } from '../../../services/stock-take.service';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../shared/modal/modal.component';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import { StockTake } from '../../../models/stock-take.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../shared/permission.directive';

@Component({
  selector: 'app-stock-taking',
  standalone: true,
  imports: [
    RouterLink,
    ModalComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    SharedDataGridComponent,
    HasPermissionDirective
  ],
  templateUrl: './stock-taking.component.html',
  styleUrl: './stock-taking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockTakingComponent {
  private stockTakeService = inject(StockTakeService);
  private router = inject(Router);
  private responsiveService = inject(ResponsiveService);
  permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  stockTakes = toSignal(this.stockTakeService.getStockTakesByStore(1), { initialValue: [] });
constructor() {
  this.onDeleteClick=(this.onDeleteClick.bind(this));
  this.onEditClick=(this.onEditClick.bind(this));
}
  // Modal state
  isDeleteModalOpen = signal(false);
  itemToDeleteId = signal<number | null>(null);

  statusLookup = [
    { value: 'Pending', display: 'معلق' },
    { value: 'Approved', display: 'معتمد' }
  ];

  /** Config-driven columns -- same fields/lookup as before (the hidden `id` column is
   *  kept as-is, same duplicated DOCUMENT_NAME caption it already had). */
  columns: dataGridColumnDto[] = [
    { dataField: 'id', dataType: 'string', caption: 'INVENTORY.STOCK_TAKING.DOCUMENT_NAME', visible: false },
    { dataField: 'documentName', dataType: 'string', caption: 'INVENTORY.STOCK_TAKING.DOCUMENT_NAME' },
    { dataField: 'documentDate', dataType: 'date', format: 'yyyy-MM-dd', caption: 'INVENTORY.STOCK_TAKING.DATE' },
    { dataField: 'createdBy', dataType: 'string', caption: 'INVENTORY.STOCK_TAKING.CONDUCTED_BY' },
    {
      dataField: 'status',
      dataType: 'string',
      caption: 'INVENTORY.STOCK_TAKING.STATUS',
      lookup: { dataSource: this.statusLookup, valueExpr: 'value', displayExpr: 'display' },
    },
    { dataField: '__actions', dataType: 'string', type: 'actions', caption: 'INVENTORY.STOCK_TAKING.ACTIONS', allowSorting: false, allowFiltering: false },
  ];

  /** Same edit/delete buttons as before -- unconditionally visible, matching the original
   *  (isEditVisible/isDeleteVisible below were defined but never actually wired to the
   *  dxi-buttons, so no status-based gating existed and none is introduced here). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('inventory.stocktaking.view') },
    { id: 'delete', icon: 'delete', labelKey: 'COMMON.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('inventory.stocktaking.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEditClick({ row: { data: e.row } });
    else if (e.actionId === 'delete') this.onDeleteClick({ row: { data: e.row } });
  }

  onEditClick = (e: any) => {
    this.editStockTake(e.row.data.id);
  };

  onDeleteClick = (e: any) => {
    this.requestDelete(e.row.data.id);
  };

  isEditVisible = (e: any) => {
    return e.row.data.status !== 'Approved';
  };

  isDeleteVisible = (e: any) => {
    return e.row.data.status !== 'Approved';
  };

  editStockTake(id: number) {
    this.router.navigate(['/inventory/stock-taking/edit', id]);
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (item: StockTake) => item.documentName;
  mobileTrackBy = (_index: number, item: StockTake) => item.id;

  private statusDisplay = (status: string) => this.statusLookup.find(s => s.value === status)?.display ?? status;

  mobileFields: MobileCardField<StockTake>[] = [
    { label: 'INVENTORY.STOCK_TAKING.DATE', value: (item) => item.documentDate ? new Date(item.documentDate).toLocaleDateString() : '' },
    { label: 'INVENTORY.STOCK_TAKING.CONDUCTED_BY', value: (item) => item.createdBy },
    { label: 'INVENTORY.STOCK_TAKING.STATUS', value: (item) => this.statusDisplay(item.status) },
  ];

  mobileEdit(item: StockTake): void {
    this.editStockTake(item.id);
  }

  mobileDelete(item: StockTake): void {
    this.requestDelete(item.id);
  }

  requestDelete(id: number) {
    this.itemToDeleteId.set(id);
    this.isDeleteModalOpen.set(true);
      this.stockTakeService.deleteStockTake(id).subscribe(() => {
        // تحديث القائمة بعد الحذف
        this.stockTakes = toSignal(this.stockTakeService.getStockTakesByStore(1), { initialValue: [] });
      }, error=> {
        console.error('خطأ أثناء حذف الجرد:', error);
      }
      );
  }

  confirmDelete() {
    const id = this.itemToDeleteId();
    if (id) {
      this.stockTakeService.deleteStockTake(id);
    }
    this.closeDeleteModal();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.itemToDeleteId.set(null);
  }
}
