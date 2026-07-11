import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseRequestDto } from '../../../models/purchase-request.model';

@Component({
  selector: 'app-purchase-request-list',
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
  templateUrl: './purchase-request-list.component.html',
  styleUrls: ['./purchase-request-list.component.css']
})
export class PurchaseRequestListComponent implements OnInit {
  purchaseRequests: PurchaseRequestDto[] = [];

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.purchaseCycleService.getPurchaseRequests().subscribe({
      next: (requests: any) => {
        this.purchaseRequests = Array.isArray(requests.data) ? requests.data : (requests?.data ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading purchase requests', err);
      }
    });
  }

  addNewRequest(): void {
    this.router.navigate(['/purchases/requests/new']);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/requests/edit', id]);
  }

  getItemsCount(rowData: PurchaseRequestDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  isDraft = (e: any): boolean => {
    const status = e?.row?.data?.status;
    return status === 'Draft' || status === 'Pending' || status === 'PendingApproval';
  };

  onApprove(e: any): void {
    const request: PurchaseRequestDto = e.row.data;
    this.purchaseCycleService.updatePurchaseRequestStatus(request.id, 'Approved').subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.APPROVE_SUCCESS'));
        this.loadRequests();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const request: PurchaseRequestDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('PURCHASE_REQUESTS.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_REQUESTS.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseCycleService.updatePurchaseRequestStatus(request.id, 'Rejected').subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.REJECT_SUCCESS'));
        this.loadRequests();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}
