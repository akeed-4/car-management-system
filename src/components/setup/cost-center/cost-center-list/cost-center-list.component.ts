import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CostCenter } from '../../../../types/cost-center.model';
import { CostCenterService } from '../../../../services/cost-center.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';

@Component({
  selector: 'app-cost-center-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    DxDataGridModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './cost-center-list.component.html',
  styleUrls: ['./cost-center-list.component.css']
})
export class CostCenterListComponent implements OnInit {
  private costCenterService = inject(CostCenterService);
  private router = inject(Router);
  public translate = inject(TranslateService);

  costCenters: CostCenter[] = [];
  filterText = '';

  constructor() {
    this.onCreate = this.onCreate.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onViewEntries = this.onViewEntries.bind(this);
  }

  ngOnInit(): void {
    this.loadCostCenters();
  }

  loadCostCenters(): void {
    this.costCenterService.getCostCenters().subscribe({
      next: (data) => {
        this.costCenters = data;
      },
      error: (error) => {
        console.error('Error loading cost centers:', error);
      }
    });
  }

  onCreate(): void {
    this.router.navigate(['/cost-centers/new']);
  }

  onEdit(e: any): void {
    const costCenter = e.row.data;
    this.router.navigate(['/cost-centers/edit', costCenter.id]);
  }

  onDelete(e: any): void {
    const costCenter = e.row.data;
    const message = this.translate.instant('COST_CENTER.CONFIRM_DELETE', { name: costCenter.name });
    if (confirm(message)) {
      this.costCenterService.deleteCostCenter(costCenter.id).subscribe({
        next: () => {
          this.loadCostCenters();
        },
        error: (error) => {
          console.error('Error deleting cost center:', error);
        }
      });
    }
  }

  onViewEntries(e: any): void {
    const costCenter = e.row.data;
    this.router.navigate(['/cost-centers', costCenter.id, 'entries']);
  }

  onRowClick(e: any): void {
    if (e.data) {
      this.router.navigate(['/cost-centers/edit', e.data.id]);
    }
  }

  getStatusColor(isActive: boolean): string {
    return isActive ? 'success' : 'default';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'COST_CENTER.ACTIVE' : 'COST_CENTER.INACTIVE';
  }
}
