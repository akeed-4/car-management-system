import { ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { PurchaseOrderService } from '../../../services/purchase-order.service';
import { PurchaseCycleRefreshService } from '../../../services/purchase-cycle-refresh.service';
import { PoDto } from '../../../models/purchase-order.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { PermissionService } from '../../../services/permission.service';
import { HasPermissionDirective } from '../../shared/permission.directive';

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    SharedDataGridComponent,
    HasPermissionDirective
  ],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.css']
})
export class PurchaseOrderListComponent implements OnInit, OnDestroy {
  purchaseOrders: PoDto[] = [];
  private refreshSubscription?: Subscription;
  private responsiveService = inject(ResponsiveService);
  private translateService = inject(TranslateService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

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

  /** Status badge cell, ported via cellTemplates (same classes as before). */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/order as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'poNumber', dataType: 'string', caption: 'PURCHASE_ORDER.PO_NUMBER' },
    { dataField: 'vendorName', dataType: 'string', caption: 'PURCHASE_ORDER.VENDOR' },
    { dataField: 'quotationNumber', dataType: 'string', caption: 'PURCHASE_ORDER.QUOTATION_NUMBER' },
    { dataField: 'poDate', dataType: 'date', caption: 'PURCHASE_ORDER.PO_DATE' },
    { dataField: 'items', dataType: 'string', caption: 'PURCHASE_ORDER.ITEMS_COUNT', calculateCellValue: this.getItemsCount },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'PURCHASE_ORDER.TOTAL_AMOUNT' },
    { dataField: 'status', dataType: 'string', caption: 'PURCHASE_ORDER.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 90, allowSorting: false, allowFiltering: false },
  ];

  /** Same single edit button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('purchases.orders.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'edit') this.onEdit({ row: { data: e.row } });
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (po: PoDto) => po.poNumber;
  mobileTrackBy = (_index: number, po: PoDto) => po.id;

  mobileFields: MobileCardField<PoDto>[] = [
    { label: 'PURCHASE_ORDER.VENDOR', value: (po) => po.vendorName },
    { label: 'PURCHASE_ORDER.QUOTATION_NUMBER', value: (po) => po.quotationNumber },
    { label: 'PURCHASE_ORDER.PO_DATE', value: (po) => po.poDate ? new Date(po.poDate).toLocaleDateString() : '' },
    { label: 'PURCHASE_ORDER.ITEMS_COUNT', value: (po) => this.getItemsCount(po) },
    { label: 'PURCHASE_ORDER.TOTAL_AMOUNT', value: (po) => po.totalAmount },
    { label: 'PURCHASE_ORDER.STATUS', value: (po) => this.translateService.instant('PURCHASE_ORDER.STATUS_' + po.status?.toUpperCase()) },
  ];

  mobileEdit(po: PoDto): void {
    this.onEdit({ row: { data: { id: po.id } } });
  }
}
