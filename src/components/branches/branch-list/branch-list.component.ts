import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { Branch } from '../../../models/branch.model';
import { BranchService } from '../../../services/branch.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { BranchFormComponent } from '../branch-form/branch-form.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-branch-list',
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
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.css']
})
export class BranchListComponent {
  private branchService = inject(BranchService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private permissionService = inject(PermissionService);

  constructor() {
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
  }

  branches = this.branchService.branches$;
  filter = signal('');

  /** Config-driven columns -- status renders through a translated lookup, as before. */
  get columns(): dataGridColumnDto[] {
    return [
      { dataField: 'nameAr', dataType: 'string', caption: 'BRANCHES.COLUMNS.NAME' },
      { dataField: 'description', dataType: 'string', caption: 'BRANCHES.COLUMNS.DESCRIPTION', allowSorting: false },
      {
        dataField: 'status',
        dataType: 'string',
        caption: 'BRANCHES.COLUMNS.STATUS',
        lookup: {
          dataSource: [
            { value: 'active', displayExpr: this.translate.instant('BRANCHES.STATUS.ACTIVE') },
            { value: 'inactive', displayExpr: this.translate.instant('BRANCHES.STATUS.INACTIVE') },
            { value: 'suspended', displayExpr: this.translate.instant('BRANCHES.STATUS.SUSPENDED') },
          ],
          valueExpr: 'value',
          displayExpr: 'displayExpr',
        },
      },
      { dataField: 'createdAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'BRANCHES.COLUMNS.CREATED' },
      { dataField: '__actions', dataType: 'string', caption: 'BRANCHES.COLUMNS.ACTIONS', type: 'actions', allowSorting: false, allowFiltering: false },
    ];
  }

  /** Row actions -- same edit/delete behavior via the shared actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'BRANCHES.ACTIONS.EDIT', visible: () => this.permissionService.hasPermission('branches.view') },
    { id: 'delete', icon: 'delete', labelKey: 'BRANCHES.ACTIONS.DELETE', cssClass: 'warn', visible: () => this.permissionService.hasPermission('branches.view') },
  ];

  /** Single dispatcher for the Shared DataGrid's rowAction output. */
  onGridAction(e: SharedGridRowActionEvent): void {
    const branch = e.row;
    if (e.actionId === 'edit') this.onEdit({ row: { data: branch } });
    else if (e.actionId === 'delete') this.onDelete({ row: { data: branch } });
  }

  /** Row-click opens edit -- same behavior as before, adapted to the shared output. */
  onGridRowClick(rowData: any): void {
    if (rowData) {
      this.onEdit(rowData);
    }
  }


  filteredBranches = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const branches = this.branches();

    if (!searchTerm) {
      return branches;
    }

    return branches.filter(branch =>
      branch.nameEn?.toLowerCase().includes(searchTerm) ||
      branch.nameAr?.toLowerCase().includes(searchTerm) ||
      branch.code?.toLowerCase().includes(searchTerm)
    );
  });

  totalBranches = computed(() => this.branches().length);
  filteredCount = computed(() => this.filteredBranches().length);

  loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (data) => {
        // Signal is updated via tap in service
      },
      error: (error) => {
        console.error('Error loading branches:', error);
      }
    });
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(BranchFormComponent, {
      width: '1400px',
      height: '80%',
      data: null,
      panelClass: 'responsive-dialog-panel'
    });
    dialogRef.afterClosed().subscribe(() => this.loadBranches());
  }

  onEdit(event: any): void {
    const branch = event.row?.data || event;
    if (branch && branch.id) {
      const dialogRef = this.dialog.open(BranchFormComponent, {
        width: '1400px',
        height: '80%',
        data: { branch },
        panelClass: 'responsive-dialog-panel'
      });
      dialogRef.afterClosed().subscribe(() => this.loadBranches());
    } else {
      console.error('Invalid branch data:', branch);
    }
  }

  onDelete(event: any): void {
    const branch = event.row?.data || event;
    if (branch && branch.id) {
      if (confirm(`Are you sure you want to delete branch "${branch.nameAr || branch.nameAr}"?`)) {
        this.branchService.delete(branch.id).subscribe({
          next: () => {
            this.loadBranches();
          },
          error: (error) => {
            console.error('Error deleting branch:', error);
          }
        });
      }
    } else {
      console.error('Invalid branch data:', branch);
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
