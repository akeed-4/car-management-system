import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-approval-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DxDataGridModule,
    DxButtonModule,
    DxTemplateModule,
    TranslateModule
  ],
  templateUrl: './purchase-requisition-approval-list.component.html',
  styleUrls: ['./purchase-requisition-approval-list.component.css']
})
export class PurchaseRequisitionApprovalListComponent implements OnInit {
  requisitions: PurchaseRequisitionDto[] = [];

  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.purchaseRequisitionService.getAll().subscribe({
      next: (requisitions: any) => {
        const all: PurchaseRequisitionDto[] = Array.isArray(requisitions) ? requisitions : (requisitions?.data ?? []);
        this.requisitions = all.filter(r => r.status === 'PendingApproval');
      },
      error: (err) => {
        console.error('Error loading purchase requisition approvals', err);
      }
    });
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/requisitions/view', id]);
  }

  getItemsCount(rowData: PurchaseRequisitionDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  onApprove(e: any): void {
    const requisition: PurchaseRequisitionDto = e.row.data;
    this.purchaseRequisitionService.approve(requisition.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.APPROVE_SUCCESS'));
        this.loadPendingApprovals();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const requisition: PurchaseRequisitionDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('PURCHASE_REQUISITION.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_REQUISITION.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseRequisitionService.reject(requisition.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.REJECT_SUCCESS'));
        this.loadPendingApprovals();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}
