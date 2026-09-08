import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SharedDataGridComponent, SharedGridRowActionEvent } from '../../../shared/shared-data-grid/shared-data-grid.component';
import { CarCategoryService } from '../../../../services/car-category.service';
import { CarCategory } from '../../../../types/car-category.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';

@Component({
  selector: 'app-car-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    SharedDataGridComponent,
    SharedMobileListComponent
  ],
  templateUrl: './car-category-list.component.html',
  styleUrl: './car-category-list.component.css'
})
export class CarCategoryListComponent {
  private carCategoryService = inject(CarCategoryService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  categories = this.carCategoryService.categories$;
  mobileSearch = signal('');

  /** Client-side search for the mobile card list (desktop keeps DevExtreme's own search panel). */
  filteredCategoriesForMobile = computed(() => {
    const term = this.mobileSearch().toLowerCase();
    const categories = this.categories();
    if (!term) return categories;
    return categories.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term)
    );
  });

  canCreate = computed(() => this.permissionService.hasPermission('carCategory.create'));

  /** Config-driven columns for the Shared DataGrid (captions are i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'id', dataType: 'number', caption: 'CAR_CATEGORY.COLUMNS.ID', width: 80, alignment: 'center' },
    { dataField: 'name', dataType: 'string', caption: 'CAR_CATEGORY.COLUMNS.NAME', minWidth: 200 },
    { dataField: 'description', dataType: 'string', caption: 'CAR_CATEGORY.COLUMNS.DESCRIPTION', minWidth: 300 },
    { dataField: '__actions', dataType: 'string', caption: 'CAR_CATEGORY.COLUMNS.ACTIONS', width: 120, alignment: 'center', type: 'actions', allowSorting: false, allowFiltering: false },
  ];

  /** Row actions -- same edit/delete behavior via the shared actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'CAR_CATEGORY.EDIT', visible: () => this.permissionService.hasPermission('carCategory.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'CAR_CATEGORY.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('carCategory.delete') },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: e.row } });
    else if (e.actionId === 'delete') this.deleteCategory(e.row.id);
  }

  onEdit(e: any): void {
    // Route is plural ("car-categories", see app.routes.ts) -- this previously pointed at the
    // singular "car-category" path, which doesn't match any route, silently breaking Edit.
    this.router.navigate(['/setup/car-categories/edit', e.row.data.id]);
  }

  deleteCategory(id: number): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.carCategoryService.deleteCategory(id).subscribe({
        next: () => {
          console.log('Category deleted successfully');
        },
        error: (error) => {
          console.error('Error deleting category', error);
        }
      });
    }
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (cat: CarCategory) => cat.name;
  mobileTrackBy = (index: number, cat: CarCategory) => cat.id ?? index;

  mobileFields: MobileListFieldDto<CarCategory>[] = [
    { label: 'CAR_CATEGORY.COLUMNS.ID', value: (cat) => cat.id },
    { label: 'CAR_CATEGORY.COLUMNS.DESCRIPTION', value: (cat) => cat.description },
  ];

  /** Same edit/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<CarCategory>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'CAR_CATEGORY.EDIT', visible: () => this.permissionService.hasPermission('carCategory.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'CAR_CATEGORY.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('carCategory.delete') },
  ];

  onMobileAction(e: MobileListActionEvent<CarCategory>): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: { id: e.item.id } } });
    else if (e.actionId === 'delete') this.deleteCategory(e.item.id);
  }
}
