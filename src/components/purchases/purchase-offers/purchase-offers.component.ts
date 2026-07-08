import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseOfferDto } from '@/src/models/purchase-offer.model';
import { NotificationService } from '@/src/services/notification.service';

@Component({
  selector: 'app-purchase-offers',
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
  templateUrl: './purchase-offers.component.html',
  styleUrls: ['./purchase-offers.component.css']
})
export class PurchaseOffersComponent implements OnInit {
  purchaseOffers: PurchaseOfferDto[] = [];

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private router: Router,
    private notificationService: NotificationService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadPurchaseOffers();
  }

  loadPurchaseOffers(): void {
    this.purchaseCycleService.getPurchaseOffers().subscribe({
      next: (offers: any) => {
        this.purchaseOffers = Array.isArray(offers) ? offers : (offers?.data ?? []);
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
    return e?.row?.data?.status === 'Pending';
  };

  onApprove(e: any): void {
    const offer: PurchaseOfferDto = e.row.data;
    this.purchaseCycleService.updatePurchaseOfferStatus(offer.id, 'Accepted').subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_OFFERS.APPROVE_SUCCESS'));
        this.loadPurchaseOffers();
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

    this.purchaseCycleService.updatePurchaseOfferStatus(offer.id, 'Rejected').subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_OFFERS.REJECT_SUCCESS'));
        this.loadPurchaseOffers();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_OFFERS.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}