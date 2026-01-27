import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridModule, DxButtonModule } from 'devextreme-angular';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Company } from '../../../models/branch.model';
import { CompanyService } from '../../../services/company.service';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { CompanyFormComponent } from '../company-form/company-form.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    DxButtonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.css']
})
export class CompanyListComponent {
  private companyService = inject(CompanyService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

constructor() {
  this.onCreate = this.onCreate.bind(this);
  this.onEdit = this.onEdit.bind(this);
  this.onDelete = this.onDelete.bind(this);
}
  companies = this.companyService.companies$;
  filter = signal('');

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
    });
  }

  onEdit(event: any): void {
    const company = event.row?.data || event;
    if (company && company.id) {
      const dialogRef = this.dialog.open(CompanyFormComponent, {
        width: '1400px',
        height: '80%',
        data: { company }
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