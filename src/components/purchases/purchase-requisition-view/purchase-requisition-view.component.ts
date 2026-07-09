import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { DxDataGridModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';

@Component({
  selector: 'app-purchase-requisition-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    DxDataGridModule,
    TranslateModule
  ],
  templateUrl: './purchase-requisition-view.component.html',
  styleUrls: ['./purchase-requisition-view.component.css']
})
export class PurchaseRequisitionViewComponent implements OnInit {
  requisition: PurchaseRequisitionDto | null = null;
  requisitionId!: number;

  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.requisitionId = +params['id'];
      this.load();
    });
  }

  load(): void {
    this.purchaseRequisitionService.getById(this.requisitionId).subscribe({
      next: (requisition) => this.requisition = requisition,
      error: (err) => {
        console.error('Error loading purchase requisition', err);
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.LOAD_ERROR'));
      }
    });
  }

  get grandTotal(): number {
    if (!this.requisition) return 0;
    return this.requisition.items.reduce((sum, i) => sum + (i.requestedQuantity * i.standardBasePrice), 0);
  }

  onEdit(): void {
    this.router.navigate(['/purchases/requisitions/edit', this.requisitionId]);
  }

  onBack(): void {
    this.router.navigate(['/purchases/requisitions']);
  }

  onSubmit(): void {
    this.purchaseRequisitionService.submit(this.requisitionId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.SUBMIT_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.SUBMIT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onApprove(): void {
    this.purchaseRequisitionService.approve(this.requisitionId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.APPROVE_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(): Promise<void> {
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('PURCHASE_REQUISITION.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_REQUISITION.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseRequisitionService.reject(this.requisitionId).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUISITION.REJECT_SUCCESS'));
        this.load();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUISITION.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }
}
