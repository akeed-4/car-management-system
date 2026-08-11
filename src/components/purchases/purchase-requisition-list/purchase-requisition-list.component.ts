import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

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
    MatIconModule,
    MobileCardListComponent
  ],
  templateUrl: './purchase-requisition-list.component.html',
  styleUrls: ['./purchase-requisition-list.component.css']
})
export class PurchaseRequisitionListComponent implements OnInit {
  requisitions: PurchaseRequisitionDto[] = [];
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequisitions();
  }

  loadRequisitions(): void {
    this.purchaseRequisitionService.getAll().subscribe({
      next: (requisitions: any) => {
        this.requisitions = Array.isArray(requisitions.data) ? requisitions.data : (requisitions?.data ?? []);
        this.cdr.detectChanges();
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

  // --- Mobile card-list rendering ---
  mobileTitleOf = (req: PurchaseRequisitionDto) => req.requisitionNumber;
  mobileTrackBy = (_index: number, req: PurchaseRequisitionDto) => req.id;

  mobileFields: MobileCardField<PurchaseRequisitionDto>[] = [
    { label: 'PURCHASE_REQUISITION.REQUISITION_DATE', value: (req) => req.requisitionDate ? new Date(req.requisitionDate).toLocaleDateString() : '' },
    { label: 'PURCHASE_REQUISITION.DEPARTMENT', value: (req) => req.departmentName },
    { label: 'PURCHASE_REQUISITION.ITEMS_COUNT', value: (req) => this.getItemsCount(req) },
    { label: 'PURCHASE_REQUISITION.STATUS', value: (req) => this.translateService.instant('PURCHASE_REQUISITION.STATUS_' + req.status?.toUpperCase()) },
  ];

  mobileCanApproveReject(req: PurchaseRequisitionDto): boolean {
    return this.isPendingApproval({ row: { data: req } });
  }

  mobileView(req: PurchaseRequisitionDto): void {
    this.onView({ row: { data: { id: req.id } } });
  }

  mobileEdit(req: PurchaseRequisitionDto): void {
    this.onEdit({ row: { data: { id: req.id } } });
  }

  mobileSubmit(req: PurchaseRequisitionDto): void {
    this.onSubmit({ row: { data: req } });
  }

  mobileApprove(req: PurchaseRequisitionDto): void {
    this.onApprove({ row: { data: req } });
  }

  mobileReject(req: PurchaseRequisitionDto): void {
    this.onReject({ row: { data: req } });
  }
}
