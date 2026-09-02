import { Component, inject, computed } from '@angular/core';
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
import { MobileCardField } from '../../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../../models/grid.model';
import { PermissionService } from '../../../../services/permission.service';

/** Year Specification list: the Trim + Model Year technical-spec level of the
 *  Make -> Model -> Trim -> YearSpecification -> Vehicle hierarchy. Mirrors
 *  CarCategoryListComponent's structure (Shared DataGrid, same row-action pattern). */
@Component({
  selector: 'app-year-specification-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, TranslateModule, SharedDataGridComponent],
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

  canCreate = computed(() => this.permissionService.hasPermission('yearSpecification.create'));
  canEdit = computed(() => this.permissionService.hasPermission('yearSpecification.edit'));
  canDelete = computed(() => this.permissionService.hasPermission('yearSpecification.delete'));

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
  mobileTrackBy = (_index: number, spec: YearSpecification) => spec.id;

  mobileFields: MobileCardField<YearSpecification>[] = [
    { label: 'YEAR_SPECIFICATION.COLUMNS.MAKE', value: (s) => s.manufacturerName },
    { label: 'YEAR_SPECIFICATION.COLUMNS.MODEL', value: (s) => s.modelName },
    { label: 'YEAR_SPECIFICATION.COLUMNS.HORSEPOWER', value: (s) => s.horsepower },
  ];

  mobileEdit(spec: YearSpecification): void {
    this.onEdit(spec);
  }

  mobileDelete(spec: YearSpecification): void {
    this.deleteSpec(spec.id);
  }
}
