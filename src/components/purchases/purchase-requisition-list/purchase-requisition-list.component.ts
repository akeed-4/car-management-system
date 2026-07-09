import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-list',
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
  templateUrl: './purchase-requisition-list.component.html',
  styleUrls: ['./purchase-requisition-list.component.css']
})
export class PurchaseRequisitionListComponent implements OnInit {
  requisitions: PurchaseRequisitionDto[] = [];

  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRequisitions();
  }

  loadRequisitions(): void {
    this.purchaseRequisitionService.getAll().subscribe({
      next: (requisitions: any) => {
        this.requisitions = Array.isArray(requisitions) ? requisitions : (requisitions?.data ?? []);
      },
      error: (err) => {
        console.error('Error loading purchase requisitions', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/requisitions/new']);
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/requisitions/view', id]);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/requisitions/edit', id]);
  }

  getItemsCount(rowData: PurchaseRequisitionDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  isDraft = (e: any): boolean => e?.row?.data?.status === 'Draft';
  isPendingApproval = (e: any): boolean => e?.row?.data?.status === 'PendingApproval';

  onSubmit(e: any): void {
    const requisition: PurchaseRequisitionDto = e.row.data;
    this.purchaseRequisitionService.submit(requisition.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.SUBMIT_SUCCESS'));
        this.loadRequisitions();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.SUBMIT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onApprove(e: any): void {
    const requisition: PurchaseRequisitionDto = e.row.data;
    this.purchaseRequisitionService.approve(requisition.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.APPROVE_SUCCESS'));
        this.loadRequisitions();
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
        this.loadRequisitions();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}
