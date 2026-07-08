import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
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
export class PurchaseOrderListComponent implements OnInit {
  purchaseOrders: PoDto[] = [];

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders(): void {
    this.purchaseCycleService.getPurchaseOrders().subscribe({
      next: (orders: any) => {
        this.purchaseOrders = Array.isArray(orders) ? orders : (orders?.data ?? []);
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
