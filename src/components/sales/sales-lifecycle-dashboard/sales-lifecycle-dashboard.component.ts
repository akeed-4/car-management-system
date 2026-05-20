import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular';
import { BunukSalesService } from '../../../services/bunuk-sales.service';
import { SalesChannel } from '../../../models/enums/sales-channel.enum';
import { CompaniesSalesService } from '@/src/services/companeis-sales.service';
import { DirectSalesService } from '@/src/services/direct-sales.service';

/**
 * Sales Lifecycle Dashboard Component
 * Main hub for managing all three sales channels
 */
@Component({
  selector: 'app-sales-lifecycle-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    DxDataGridModule
  ],
  templateUrl: './sales-lifecycle-dashboard.component.html',
  styleUrls: ['./sales-lifecycle-dashboard.component.css']
})
export class SalesLifecycleDashboardComponent implements OnInit {
  @ViewChild('afradGrid') afradGrid!: DxDataGridComponent;
  @ViewChild('sharikatGrid') sharikatGrid!: DxDataGridComponent;
  @ViewChild('bunukGrid') bunukGrid!: DxDataGridComponent;

  selectedTabIndex = 0;
  isLoading = false;

  // Data sources
  afradOrders: any[] = [];
  sharikatOrders: any[] = [];
  bunukOrders: any[] = [];

  // Statistics
  statistics = {
    afrad: { total: 0, reserved: 0, approved: 0, delivered: 0, totalAmount: 0 },
    sharikat: { total: 0, pending: 0, approved: 0, delivered: 0, totalAmount: 0 },
    bunuk: { total: 0, pendingFinancing: 0, approved: 0, delivered: 0, totalAmount: 0 }
  };

  SalesChannel = SalesChannel;

  constructor(
    private directSalesService: DirectSalesService,
    private companiesSalesService: CompaniesSalesService,
    private bunukService: BunukSalesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading = true;
    Promise.all([
      this.loadAfradData(),
      this.loadSharikatData(),
      this.loadBunukData()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  loadAfradData(): Promise<void> {
    return new Promise((resolve) => {
      this.directSalesService.getAll().subscribe({
        next: (data) => {
          this.afradOrders = data;
          this.calculateAfradStatistics();
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadSharikatData(): Promise<void> {
    return new Promise((resolve) => {
      this.companiesSalesService.getAll().subscribe({
        next: (data) => {
          this.sharikatOrders = data;
          this.calculateSharikatStatistics();
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  loadBunukData(): Promise<void> {
    return new Promise((resolve) => {
      this.bunukService.getAll().subscribe({
        next: (data) => {
          this.bunukOrders = data;
          this.calculateBunukStatistics();
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  calculateAfradStatistics(): void {
    this.statistics.afrad = {
      total: this.afradOrders.length,
      reserved: this.afradOrders.filter(o => o.status === 'Reserved').length,
      approved: this.afradOrders.filter(o => o.status === 'Approved').length,
      delivered: this.afradOrders.filter(o => o.status === 'Delivered').length,
      totalAmount: this.afradOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
  }

  calculateSharikatStatistics(): void {
    this.statistics.sharikat = {
      total: this.sharikatOrders.length,
      pending: this.sharikatOrders.filter(o => o.status === 'PendingApproval').length,
      approved: this.sharikatOrders.filter(o => o.status === 'Approved').length,
      delivered: this.sharikatOrders.filter(o => o.status === 'Delivered').length,
      totalAmount: this.sharikatOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    };
  }

  calculateBunukStatistics(): void {
    this.statistics.bunuk = {
      total: this.bunukOrders.length,
      pendingFinancing: this.bunukOrders.filter(o => o.status === 'PendingFinancing').length,
      approved: this.bunukOrders.filter(o => o.status === 'FinanceApproved').length,
      delivered: this.bunukOrders.filter(o => o.status === 'Delivered').length,
      totalAmount: this.bunukOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0)
    };
  }

  // Navigation methods
  createAfradOrder(): void {
    this.router.navigate(['/sales/lifecycle/afrad/create']);
  }

  createSharikatOrder(): void {
    this.router.navigate(['/sales/lifecycle/sharikat/create']);
  }

  createBunukOrder(): void {
    this.router.navigate(['/sales/lifecycle/bunuk/create']);
  }

  viewAfradOrder(e: any): void {
    if (e.row?.data?.id) {
      this.router.navigate(['/sales/lifecycle/afrad', e.row.data.id]);
    }
  }

  viewSharikatOrder(e: any): void {
    if (e.row?.data?.id) {
      this.router.navigate(['/sales/lifecycle/sharikat', e.row.data.id]);
    }
  }

  viewBunukOrder(e: any): void {
    if (e.row?.data?.id) {
      this.router.navigate(['/sales/lifecycle/bunuk', e.row.data.id]);
    }
  }

  // Status cell template helpers
  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'Draft': '#9e9e9e',
      'Reserved': '#2196f3',
      'Approved': '#4caf50',
      'PendingApproval': '#ff9800',
      'PendingFinancing': '#ff9800',
      'FinanceApproved': '#4caf50',
      'Delivered': '#9c27b0',
      'Cancelled': '#f44336',
      'Rejected': '#f44336'
    };
    return colorMap[status] || '#9e9e9e';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(value || 0);
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  refreshCurrentTab(): void {
    switch (this.selectedTabIndex) {
      case 0:
        this.loadAfradData();
        break;
      case 1:
        this.loadSharikatData();
        break;
      case 2:
        this.loadBunukData();
        break;
    }
  }
}
