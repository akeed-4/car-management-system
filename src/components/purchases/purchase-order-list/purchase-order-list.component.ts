import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { PurchaseCycleRefreshService } from '../../../services/purchase-cycle-refresh.service';
import { PoDto } from '../../../models/purchase-order.model';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css']
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  purchaseOrders: PoDto[] = [];
  private refreshSubscription?: Subscription;

  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private purchaseCycleRefreshService: PurchaseCycleRefreshService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOrders();
    this.refreshSubscription = this.purchaseCycleRefreshService.poListChanged$.subscribe(() => this.loadPurchaseOrders());
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadPurchaseOrders(): void {
    this.purchaseOrderService.getAll().subscribe({
      next: (orders: any) => {
        this.purchaseOrders = Array.isArray(orders) ? orders : (orders?.data ?? []);
      this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase orders', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/orders/new']);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/orders/edit', id]);
  }

  getItemsCount(rowData: PoDto): number {
    return rowData.items ? rowData.items.length : 0;
  }
}
