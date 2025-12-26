import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
export class CostCenterListComponent implements OnInit {
  private costCenterService = inject(CostCenterService);
  private router = inject(Router);
  public translate = inject(TranslateService);

  // Signals for reactive state
  costCenters = signal<CostCenter[]>([]);

  // Computed properties for reactive data
  costCentersWithLevels = computed(() => this.calculateLevels(this.costCenters()));
  totalCostCenters = computed(() => this.costCenters().length);
  activeCostCenters = computed(() => this.costCenters().filter(cc => cc.isActive).length);

  constructor() {
    this.onCreate = this.onCreate.bind(this);
    this.onAddChild = this.onAddChild.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onViewEntries = this.onViewEntries.bind(this);

    // Bind methods for DevExtreme buttons
    this.addChildClick = this.addChildClick.bind(this);
    this.viewEntriesClick = this.viewEntriesClick.bind(this);
    this.editClick = this.editClick.bind(this);
    this.deleteClick = this.deleteClick.bind(this);
  }

  ngOnInit(): void {
    this.loadCostCenters();
  }

  loadCostCenters(): void {
    this.costCenterService.getCostCenters().subscribe({
      next: (data) => {
        console.log('Loaded cost centers data:', data);
        this.costCenters.set(data);
      },
      error: (error) => {
        console.error('Error loading cost centers:', error);
      }
    });
  }

  calculateLevels(costCenters: CostCenter[]): CostCenter[] {
    if (!costCenters || !Array.isArray(costCenters)) {
      return [];
    }
    const result: CostCenter[] = [];
    const processed = new Set<number>();

    const processLevel = (parentId: number | null, level: number): void => {
      const children = costCenters.filter(cc => cc.parentId === parentId && !processed.has(cc.id));
      children.forEach(child => {
        processed.add(child.id);
        (child as any).level = level;
        result.push(child);
        processLevel(child.id, level + 1);
      });
    };

    // Start with root level (parentId is null)
    processLevel(null, 1);

    return result;
  }

  onCreate(): void {
    this.router.navigate(['/cost-centers/new']);
  }

  onAddChild(e: any): void {
    const parent = e.row.data;
    this.router.navigate(['/cost-centers/new'], { queryParams: { parentId: parent.id } });
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

  // DevExtreme button click handlers
  addChildClick(e: any): void {
    this.onAddChild(e);
  }

  viewEntriesClick(e: any): void {
    this.onViewEntries(e);
  }

  editClick(e: any): void {
    this.onEdit(e);
  }

  deleteClick(e: any): void {
    this.onDelete(e);
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
    return this.costCenters().some(cc => cc.parentId === costCenter.id);
  }
}
