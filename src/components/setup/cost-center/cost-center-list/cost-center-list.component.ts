import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
import { DxTreeListModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CostCenter } from '../../../../types/cost-center.model';
import { CostCenterService } from '../../../../services/cost-center.service';
import { HasPermissionDirective } from '../../../shared/permission.directive';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
    DxTreeListModule,
    TranslateModule,
    FormsModule,
    HasPermissionDirective
  ],
  templateUrl: './cost-center-list.component.html',
  styleUrls: ['./cost-center-list.component.css']
})
export class CostCenterListComponent implements OnInit, OnDestroy {
  private costCenterService = inject(CostCenterService);
  private router = inject(Router);
  public translate = inject(TranslateService);
  private destroy$ = new Subject<void>();

  costCenters: CostCenter[] = [];
  filterText = '';

  // DevExtreme TreeList columns configuration
  columns: any[] = [];

  constructor() {
    this.onCreate = this.onCreate.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onViewEntries = this.onViewEntries.bind(this);
  }

  ngOnInit(): void {
    this.loadCostCenters();
    this.initializeColumns();

    // Subscribe to language changes to update column translations
    this.translate.onLangChange.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initializeColumns();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeColumns() {
    this.columns = [
      {
        dataField: 'code',
        caption: this.translate.instant('COST_CENTER.CODE'),
        width: 120,
        cssClass: 'code-column'
      },
      {
        dataField: 'name',
        caption: this.translate.instant('COST_CENTER.NAME'),
        cellTemplate: 'nameTemplate'
      },
      {
        dataField: 'nameAr',
        caption: this.translate.instant('COST_CENTER.NAME_AR')
      },
      {
        dataField: 'carInfo',
        caption: this.translate.instant('COST_CENTER.CAR_INFO'),
        cellTemplate: 'carInfoTemplate'
      },
      {
        dataField: 'totalCosts',
        caption: this.translate.instant('COST_CENTER.TOTAL_COSTS'),
        dataType: 'number',
        format: { type: 'currency', currency: 'SAR', precision: 2 },
        alignment: 'right',
        width: 150
      },
      {
        dataField: 'isActive',
        caption: this.translate.instant('COST_CENTER.STATUS'),
        cellTemplate: 'statusTemplate',
        width: 120,
        alignment: 'center'
      },
      {
        dataField: 'createdAt',
        caption: this.translate.instant('COST_CENTER.CREATED_AT'),
        dataType: 'date',
        format: 'yyyy-MM-dd',
        width: 120
      },
      {
        type: 'buttons',
        width: 150,
        caption: this.translate.instant('COST_CENTER.ACTIONS'),
        buttons: [
          {
            hint: this.translate.instant('COST_CENTER.VIEW_ENTRIES'),
            icon: 'chart',
            onClick: this.onViewEntries
          },
          {
            hint: this.translate.instant('COST_CENTER.EDIT'),
            icon: 'edit',
            onClick: this.onEdit
          },
          {
            hint: this.translate.instant('COST_CENTER.DELETE'),
            icon: 'trash',
            onClick: this.onDelete
          }
        ]
      }
    ];
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

  hasChildren(costCenter: CostCenter): boolean {
    return this.costCenters.some(cc => cc.parentId === costCenter.id);
  }
}
