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
import { Company } from '../../../models/branch.model';
import { CompanyService } from '../../../services/company.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { CompanyFormComponent } from '../company-form/company-form.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-company-list',
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
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent {
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private translate = inject(TranslateService);

constructor() {
  this.onCreate = this.onCreate.bind(this);
  this.onEdit = this.onEdit.bind(this);
  this.onDelete = this.onDelete.bind(this);
}
  companies = this.companyService.companies$;
  filter = signal('');

  /** Config-driven columns -- status renders through a translated lookup, as before. */
  get columns(): dataGridColumnDto[] {
    return [
      { dataField: 'nameAr', dataType: 'string', caption: 'COMPANIES.COLUMNS.NAME_AR' },
      { dataField: 'description', dataType: 'string', caption: 'COMPANIES.COLUMNS.DESCRIPTION', allowSorting: false },
      {
        dataField: 'status',
        dataType: 'string',
        caption: 'COMPANIES.COLUMNS.STATUS',
        lookup: {
          dataSource: [
            { value: 'active', displayExpr: this.translate.instant('COMPANIES.STATUS.ACTIVE') },
            { value: 'inactive', displayExpr: this.translate.instant('COMPANIES.STATUS.INACTIVE') },
            { value: 'suspended', displayExpr: this.translate.instant('COMPANIES.STATUS.SUSPENDED') },
          ],
          valueExpr: 'value',
          displayExpr: 'displayExpr',
        },
      },
      { dataField: 'createdAt', dataType: 'date', format: 'yyyy-MM-dd', caption: 'COMPANIES.COLUMNS.CREATED' },
      { dataField: '__actions', dataType: 'string', caption: 'COMPANIES.COLUMNS.ACTIONS', type: 'actions', allowSorting: false, allowFiltering: false },
    ];
  }

  /** Row actions -- same edit/delete behavior via the shared actions template. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMPANIES.ACTIONS.EDIT' },
    { id: 'delete', icon: 'delete', labelKey: 'COMPANIES.ACTIONS.DELETE', cssClass: 'warn' },
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

  filteredCompanies = computed(() => {
    const searchTerm = this.filter().toLowerCase();
    const companies = this.companies();

    if (!searchTerm) {
      return companies;
    }

    return companies.filter(company =>
      company.nameEn?.toLowerCase().includes(searchTerm) ||
      company.nameAr?.toLowerCase().includes(searchTerm) ||
      company.code?.toLowerCase().includes(searchTerm)
    );
  });

  loadCompanies(): void {
    this.companyService.getAll().subscribe({
      next: (data) => {
        // Signal is updated via tap in service
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      }
    });
  }
     
  

  onCreate(): void {
    const dialogRef = this.dialog.open(CompanyFormComponent, {
      width: '1400px',
      height: '80%',
      panelClass: 'responsive-dialog-panel'
    });
  }

  onEdit(event: any): void {
    const company = event.row?.data || event;
    if (company && company.id) {
      const dialogRef = this.dialog.open(CompanyFormComponent, {
        width: '1400px',
        height: '80%',
        data: { company },
        panelClass: 'responsive-dialog-panel'
      });}
  }

  onDelete(event: any): void {
    const company = event.row?.data || event;
    if (company && company.id) {
      if (confirm(`Are you sure you want to delete company "${company.nameAr || company.nameAr}"?`)) {
        this.companyService.delete(company.id).subscribe({
          next: () => {
            this.loadCompanies();
          },
          error: (error) => {
            console.error('Error deleting company:', error);
          }
        });
      }
    } else {
      console.error('Invalid company data:', company);
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