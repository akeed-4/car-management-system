import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SharedDataGridComponent, SharedGridRowActionEvent } from '../../../shared/shared-data-grid/shared-data-grid.component';
import { YearSpecificationService } from '../../../../services/year-specification.service';
import { YearSpecification } from '../../../../models/year-specification.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { NotificationService } from '@/src/services/notification.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListActionDto, MobileListActionEvent, MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';

/** Year Specification list: the Trim + Model Year technical-spec level of the
 *  Make -> Model -> Trim -> YearSpecification -> Vehicle hierarchy. Mirrors
 *  CarCategoryListComponent's structure (Shared DataGrid, same row-action pattern). */
@Component({
  selector: 'app-year-specification-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, TranslateModule, SharedDataGridComponent, SharedMobileListComponent],
  templateUrl: './year-specification-list.component.html',
  styleUrl: './year-specification-list.component.css'
})
export class YearSpecificationListComponent {
  private yearSpecService = inject(YearSpecificationService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private responsiveService = inject(ResponsiveService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  specs = this.yearSpecService.specs$;
  mobileSearch = signal('');

  /** Client-side search for the mobile card list (desktop keeps DevExtreme's own search panel). */
  filteredSpecsForMobile = computed(() => {
    const term = this.mobileSearch().toLowerCase();
    const specs = this.specs();
    if (!term) return specs;
    return specs.filter(s =>
      s.manufacturerName?.toLowerCase().includes(term) ||
      s.modelName?.toLowerCase().includes(term) ||
      s.trimNameEn?.toLowerCase().includes(term) ||
      String(s.year).includes(term)
    );
  });

  canCreate = computed(() => this.permissionService.hasPermission('yearSpecification.create'));

  columns: dataGridColumnDto[] = [
    { dataField: 'manufacturerName', dataType: 'string', caption: 'YEAR_SPECIFICATION.COLUMNS.MAKE', minWidth: 120 },
    { dataField: 'modelName', dataType: 'string', caption: 'YEAR_SPECIFICATION.COLUMNS.MODEL', minWidth: 120 },
    { dataField: 'trimNameEn', dataType: 'string', caption: 'YEAR_SPECIFICATION.COLUMNS.TRIM', minWidth: 120 },
    { dataField: 'year', dataType: 'number', caption: 'YEAR_SPECIFICATION.COLUMNS.YEAR', width: 100, alignment: 'center' },
    { dataField: 'horsepower', dataType: 'number', caption: 'YEAR_SPECIFICATION.COLUMNS.HORSEPOWER', width: 110, alignment: 'center' },
    { dataField: 'standardAgencyPrice', dataType: 'number', caption: 'YEAR_SPECIFICATION.COLUMNS.PRICE', width: 140, alignment: 'right' },
    { dataField: '__actions', dataType: 'string', caption: 'YEAR_SPECIFICATION.COLUMNS.ACTIONS', width: 120, alignment: 'center', type: 'actions', allowSorting: false, allowFiltering: false },
  ];

  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'YEAR_SPECIFICATION.EDIT', visible: () => this.permissionService.hasPermission('yearSpecification.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'YEAR_SPECIFICATION.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('yearSpecification.delete') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit(e.row as YearSpecification);
    else if (e.actionId === 'delete') this.deleteSpec(e.row.id);
  }

  onEdit(spec: YearSpecification): void {
    this.router.navigate(['/setup/year-specifications/edit', spec.id]);
  }

  deleteSpec(id: number): void {
    if (!confirm('Are you sure you want to delete this Year Specification?')) return;
    this.yearSpecService.delete(id).subscribe({
      error: (error) => {
        const backendMessage = typeof error?.error?.message === 'string' ? error.error.message : null;
        this.notificationService.showError(backendMessage || 'Failed to delete Year Specification');
      }
    });
  }

  mobileTitleOf = (spec: YearSpecification) => `${spec.trimNameEn} — ${spec.year}`;
  mobileTrackBy = (index: number, spec: YearSpecification) => spec.id ?? index;

  mobileFields: MobileListFieldDto<YearSpecification>[] = [
    { label: 'YEAR_SPECIFICATION.COLUMNS.MAKE', value: (s) => s.manufacturerName },
    { label: 'YEAR_SPECIFICATION.COLUMNS.MODEL', value: (s) => s.modelName },
    { label: 'YEAR_SPECIFICATION.COLUMNS.HORSEPOWER', value: (s) => s.horsepower },
  ];

  /** Same edit/delete actions as the desktop grid's row actions. */
  mobileActions: MobileListActionDto<YearSpecification>[] = [
    { id: 'edit', icon: 'edit', labelKey: 'YEAR_SPECIFICATION.EDIT', visible: () => this.permissionService.hasPermission('yearSpecification.edit') },
    { id: 'delete', icon: 'delete', labelKey: 'YEAR_SPECIFICATION.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('yearSpecification.delete') },
  ];

  onMobileAction(e: MobileListActionEvent<YearSpecification>): void {
    if (e.actionId === 'edit') this.onEdit(e.item);
    else if (e.actionId === 'delete') this.deleteSpec(e.item.id);
  }
}
