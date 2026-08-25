import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { Store } from '../../../models/branch.model';
import { StoreService } from '../../../services/store.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { StoreFormComponent } from '../store-form/store-form.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective,
    SharedDataGridComponent
  ],
  templateUrl: './store-list.component.html',
  styleUrls: ['./store-list.component.css']
})
export class StoreListComponent {
  private storeService = inject(StoreService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  stores = this.storeService.stores$;
  filter = signal('');
constructor(){
  this.onCreate=this.onCreate.bind(this);
  this.onDelete=this.onDelete.bind(this);
  this.onEdit=this.onEdit.bind(this);
}

  /** Config-driven columns -- status renders through a translated lookup, as before. */
  get columns(): dataGridColumnDto[] {
    return [
      { dataField: 'nameAr', dataType: 'string', caption: 'STORES.COLUMNS.NAME_AR' },
      { dataField: 'description', dataType: 'string', caption: 'STORES.COLUMNS.DESCRIPTION', allowSorting: false },
      { dataField: 'activityName', dataType: 'string', caption: 'STORES.COLUMNS.ACTIVITY' },
      { dataField: 'branchName', dataType: 'string', caption: 'STORES.COLUMNS.BRANCH' },
      {
        dataField: 'status',
        dataType: 'string',
        caption: 'STORES.COLUMNS.STATUS',
        lookup: {
          dataSource: [
            { value: 'active', displayExpr: this.translate.instant('STORES.STATUS.ACTIVE') },
            { value: 'inactive', displayExpr: this.translate.instant('STORES.STATUS.INACTIVE') },
            { value: 'suspended', displayExpr: this.translate.instant('STORES.STATUS.SUSPENDED') },
          ],
          valueExpr: 'value',
          displayExpr: 'displayExpr',
        },
      },
      { dataField: 'createdAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'STORES.COLUMNS.CREATED' },
      { dataField: '__actions', dataType: 'string', caption: 'STORES.COLUMNS.ACTIONS', type: 'actions', allowSorting: false, allowFiltering: false },
    ];
  }

  /** Row actions -- same edit/delete behavior via the shared actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'STORES.ACTIONS.EDIT' },
    { id: 'delete', icon: 'delete', labelKey: 'STORES.ACTIONS.DELETE', cssClass: 'warn' },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: e.row } });
    else if (e.actionId === 'delete') this.onDelete({ row: { data: e.row } });
  }

  /** Row-click opens edit -- same behavior as before, adapted to the shared output. */
  onGridRowClick(rowData: any): void {
    if (rowData) {
      this.onEdit(rowData);
    }
  }

  filteredStores = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const stores = this.stores();

    if (!searchTerm) {
      return stores;
    }

    return stores.filter(store =>
      store.nameEn?.toLowerCase().includes(searchTerm) ||
      store.nameAr?.toLowerCase().includes(searchTerm) ||
      store.code?.toLowerCase().includes(searchTerm)
    );
  });

  loadStores(): void {
    this.storeService.getAll().subscribe({
      next: (data) => {
        // Signal is updated via tap in service
      },
      error: (error) => {
        console.error('Error loading stores:', error);
      }
    });
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(StoreFormComponent, {
    width: '1400px',
      height: '80%',
      data: null,
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStores();
      }
    });
  }

  onEdit(store: any): void {
    const dialogRef = this.dialog.open(StoreFormComponent, {
      width: '1400px',
      height: '90%',
      data: store.row.data.id,
      panelClass: 'responsive-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStores();
      }
    });
  }

  onDelete(store: any): void {
    store = store.row.data ? store.row.data : store;
    if (confirm(`Are you sure you want to delete store "${store.nameAr}"?`)) {
      this.storeService.delete(store.id).subscribe({
        next: () => {
          this.loadStores();
        },
        error: (error) => {
          console.error('Error deleting store:', error);
        }
      });
    }
  }

  onRowClick(event: any): void {
    if (event.data) {
      this.onEdit(event.data);
    }
  }

  // Unit test: Test data loading, CRUD operations, permission checks
  // Storybook: Story for grid with different data states
}