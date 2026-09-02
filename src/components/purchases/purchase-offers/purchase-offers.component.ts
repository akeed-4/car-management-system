import { ChangeDetectorRef, Component, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { PurchaseCycleRefreshService } from '../../../services/purchase-cycle-refresh.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseOfferDto } from '@/src/models/purchase-offer.model';
import { NotificationService } from '@/src/services/notification.service';
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
  selector: 'app-purchase-offers',
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
  templateUrl: './purchase-offers.component.html',
  styleUrls: ['./purchase-offers.component.css']
})
export class PurchaseOffersComponent implements OnInit {
  purchaseOffers: PurchaseOfferDto[] = [];
  private responsiveService = inject(ResponsiveService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private purchaseCycleRefreshService: PurchaseCycleRefreshService,
    private router: Router,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOffers();
  }

  loadPurchaseOffers(): void {
    this.purchaseCycleService.getPurchaseOffers().subscribe({
      next: (response: any) => {
        const offers = response?.data ?? response;
        this.purchaseOffers = Array.isArray(offers) ? offers : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase offers', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/offers/new']);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/offers/edit', id]);
  }

  getItemsCount(rowData: PurchaseOfferDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  isPending = (e: any): boolean => {
    return e?.row?.data?.status === 'Draft' || e?.row?.data?.status === 'PendingApproval';
  };

  onApprove(e: any): void {
    const offer: PurchaseOfferDto = e.row.data;
    this.purchaseCycleService.approvePurchaseOffer(offer.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_OFFERS.APPROVE_SUCCESS'));
        this.loadPurchaseOffers();
        this.purchaseCycleRefreshService.notifyOffersChanged();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_OFFERS.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const offer: PurchaseOfferDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('PURCHASE_OFFERS.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_OFFERS.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseCycleService.rejectPurchaseOffer(offer.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_OFFERS.REJECT_SUCCESS'));
        this.loadPurchaseOffers();
        this.purchaseCycleRefreshService.notifyOffersChanged();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_OFFERS.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  /** Status badge cell, ported via cellTemplates (same classes as before). */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/order as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'offerNumber', dataType: 'string', caption: 'PURCHASE_OFFER.OFFER_NUMBER' },
    { dataField: 'supplierName', dataType: 'string', caption: 'PURCHASE_OFFER.SUPPLIER' },
    { dataField: 'offerDate', dataType: 'date', caption: 'PURCHASE_OFFER.OFFER_DATE' },
    { dataField: 'items', dataType: 'string', caption: 'PURCHASE_OFFERS.ITEMS_COUNT', calculateCellValue: this.getItemsCount },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'PURCHASE_OFFERS.TOTAL_AMOUNT' },
    { dataField: 'status', dataType: 'string', caption: 'PURCHASE_OFFER.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 160, allowSorting: false, allowFiltering: false },
  ];

  /** Same edit/approve/reject buttons as before (approve/reject only while pending). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT', visible: () => this.permissionService.hasPermission('purchases.offers.view') },
    { id: 'approve', icon: 'check', labelKey: 'PURCHASE_OFFERS.APPROVE', visible: (row) => this.isPending({ row: { data: row } }) && this.permissionService.hasPermission('purchases.offers.view') },
    { id: 'reject', icon: 'close', labelKey: 'PURCHASE_OFFERS.REJECT', visible: (row) => this.isPending({ row: { data: row } }) && this.permissionService.hasPermission('purchases.offers.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'approve') this.onApprove(wrapped);
    else if (e.actionId === 'reject') this.onReject(wrapped);
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (offer: PurchaseOfferDto) => offer.offerNumber;
  mobileTrackBy = (_index: number, offer: PurchaseOfferDto) => offer.id;

  mobileFields: MobileCardField<PurchaseOfferDto>[] = [
    { label: 'PURCHASE_OFFER.SUPPLIER', value: (offer) => offer.supplierName },
    { label: 'PURCHASE_OFFER.OFFER_DATE', value: (offer) => offer.offerDate ? new Date(offer.offerDate).toLocaleDateString() : '' },
    { label: 'PURCHASE_OFFERS.ITEMS_COUNT', value: (offer) => this.getItemsCount(offer) },
    { label: 'PURCHASE_OFFERS.TOTAL_AMOUNT', value: (offer) => offer.totalAmount },
    { label: 'PURCHASE_OFFER.STATUS', value: (offer) => this.translateService.instant('PURCHASE_OFFER.STATUS_' + offer.status?.toUpperCase()) },
  ];

  mobileCanApproveReject(offer: PurchaseOfferDto): boolean {
    return this.isPending({ row: { data: offer } });
  }

  mobileEdit(offer: PurchaseOfferDto): void {
    this.onEdit({ row: { data: { id: offer.id } } });
  }

  mobileApprove(offer: PurchaseOfferDto): void {
    this.onApprove({ row: { data: offer } });
  }

  mobileReject(offer: PurchaseOfferDto): void {
    this.onReject({ row: { data: offer } });
  }
}
