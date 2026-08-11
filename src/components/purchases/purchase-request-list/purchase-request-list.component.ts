import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseCycleService } from '../../../services/purchase-cycle.service';
import { NotificationService } from '../../../services/notification.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PurchaseRequestDto } from '../../../models/purchase-request.model';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { PermissionService } from '../../../services/permission.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

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
    MatIconModule,
    MatTooltipModule,
    HasPermissionDirective,
    MobileCardListComponent
  ],
  templateUrl: './purchase-request-list.component.html',
  styleUrls: ['./purchase-request-list.component.css']
})
export class PurchaseRequestListComponent implements OnInit {
  purchaseRequests: PurchaseRequestDto[] = [];
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    private purchaseCycleService: PurchaseCycleService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private permissionService: PermissionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.purchaseCycleService.getPurchaseRequests().subscribe({
      next: (requests) => {
        this.purchaseRequests = requests ?? [];
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

  /** Approved/Rejected requests are locked server-side (UpdateAsync rejects them) -- only Pending is actually editable. */
  canEdit = (e: any): boolean => this.isDraft(e) && this.permissionService.hasPermission('purchaseRequest.edit');
  canApprove = (e: any): boolean => this.isDraft(e) && this.permissionService.hasPermission('purchaseRequest.approve');
  canReject = (e: any): boolean => this.isDraft(e) && this.permissionService.hasPermission('purchaseRequest.reject');
  /** Approved requests are locked -- everything else (including Rejected, for cleanup) may still be deleted. */
  canDelete = (e: any): boolean => e?.row?.data?.status !== 'Approved' && this.permissionService.hasPermission('purchaseRequest.delete');

  private describeError(err: any): string {
    return err?.error?.message ?? err?.error ?? err?.message ?? 'Unknown error';
  }

  onApprove(e: any): void {
    const request: PurchaseRequestDto = e.row.data;
    this.purchaseCycleService.approvePurchaseRequest(request.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.APPROVE_SUCCESS'));
        this.loadRequests();
      },
      error: (err: any) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.APPROVE_ERROR') + ': ' + this.describeError(err));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const request: PurchaseRequestDto = e.row.data;
    const result = await this.notificationService.confirmAlertWithInput(
      this.translateService.instant('PURCHASE_REQUESTS.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_REQUESTS.REJECT_REASON_PROMPT')
    );
    if (!result.isConfirmed) return;

    const reason = (result.value ?? '').trim();
    if (!reason) {
      this.notificationService.showWarning(this.translateService.instant('PURCHASE_REQUESTS.REJECT_REASON_REQUIRED'));
      return;
    }

    this.purchaseCycleService.rejectPurchaseRequest(request.id, reason).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.REJECT_SUCCESS'));
        this.loadRequests();
      },
      error: (err: any) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.REJECT_ERROR') + ': ' + this.describeError(err));
      }
    });
  }

  async onDelete(e: any): Promise<void> {
    const request: PurchaseRequestDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('PURCHASE_REQUESTS.DELETE_CONFIRM_TITLE'),
      this.translateService.instant('PURCHASE_REQUESTS.DELETE_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.purchaseCycleService.deletePurchaseRequest(request.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('PURCHASE_REQUESTS.DELETE_SUCCESS'));
        this.loadRequests();
      },
      error: (err: any) => {
        this.notificationService.showError(this.translateService.instant('PURCHASE_REQUESTS.DELETE_ERROR') + ': ' + this.describeError(err));
      }
    });
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (req: PurchaseRequestDto) => req.requestNumber;
  mobileTrackBy = (_index: number, req: PurchaseRequestDto) => req.id;

  mobileFields: MobileCardField<PurchaseRequestDto>[] = [
    { label: 'PURCHASE_REQUESTS.REQUEST_DATE', value: (req) => req.requestDate ? new Date(req.requestDate).toLocaleDateString() : '' },
    { label: 'PURCHASE_REQUESTS.SUPPLIER', value: (req) => req.supplierName },
    { label: 'PURCHASE_REQUESTS.ITEMS_COUNT', value: (req) => this.getItemsCount(req) },
    { label: 'PURCHASE_OFFERS.TOTAL_AMOUNT', value: (req) => req.totalAmount },
    { label: 'PURCHASE_REQUESTS.STATUS', value: (req) => this.translateService.instant('PURCHASE_REQUESTS.STATUS_' + req.status?.toUpperCase()) },
  ];

  mobileCanEdit(req: PurchaseRequestDto): boolean {
    return this.canEdit({ row: { data: req } });
  }

  mobileCanApprove(req: PurchaseRequestDto): boolean {
    return this.canApprove({ row: { data: req } });
  }

  mobileCanReject(req: PurchaseRequestDto): boolean {
    return this.canReject({ row: { data: req } });
  }

  mobileCanDelete(req: PurchaseRequestDto): boolean {
    return this.canDelete({ row: { data: req } });
  }

  mobileEdit(req: PurchaseRequestDto): void {
    this.onEdit({ row: { data: { id: req.id } } });
  }

  mobileApprove(req: PurchaseRequestDto): void {
    this.onApprove({ row: { data: req } });
  }

  mobileReject(req: PurchaseRequestDto): void {
    this.onReject({ row: { data: req } });
  }

  mobileDelete(req: PurchaseRequestDto): void {
    this.onDelete({ row: { data: req } });
  }
}
