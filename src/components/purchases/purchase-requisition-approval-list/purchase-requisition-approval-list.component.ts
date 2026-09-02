import { ChangeDetectorRef, Component, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PurchaseRequisitionService } from '../../../services/purchase-requisition.service';
import { NotificationService } from '../../../services/notification.service';
import { PurchaseRequisitionDto } from '../../../models/purchase-requisition.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-purchase-requisition-approval-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    SharedDataGridComponent
  ],
  templateUrl: './purchase-requisition-approval-list.component.html',
  styleUrls: ['./purchase-requisition-approval-list.component.css']
})
export class PurchaseRequisitionApprovalListComponent implements OnInit {
  requisitions: PurchaseRequisitionDto[] = [];
  private responsiveService = inject(ResponsiveService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    private purchaseRequisitionService: PurchaseRequisitionService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPendingApprovals();
  }

  loadPendingApprovals(): void {
    this.purchaseRequisitionService.getAll().subscribe({
      next: (requisitions: any) => {
        const all: PurchaseRequisitionDto[] = Array.isArray(requisitions.data) ? requisitions.data : (requisitions?.data ?? []);
        this.requisitions = all;
        this.cdr.detectChanges();
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

  isDraft = (e: any): boolean => e.row.data.status === 'Draft';

  isPendingApproval = (e: any): boolean => e.row.data.status === 'PendingApproval';

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

  /** Status badge cell, ported via cellTemplates (same markup as before -- always the
   *  "pending" style, since this list only ever contains pending-approval rows). */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/order as before. */
  columns: dataGridColumnDto[] = [
    { dataField: 'requisitionNumber', dataType: 'string', caption: 'PURCHASE_REQUISITION.REQUISITION_NUMBER' },
    { dataField: 'requisitionDate', dataType: 'date', caption: 'PURCHASE_REQUISITION.REQUISITION_DATE' },
    { dataField: 'departmentName', dataType: 'string', caption: 'PURCHASE_REQUISITION.DEPARTMENT' },
    { dataField: 'items', dataType: 'string', caption: 'PURCHASE_REQUISITION.ITEMS_COUNT', calculateCellValue: this.getItemsCount },
    { dataField: 'status', dataType: 'string', caption: 'PURCHASE_REQUISITION.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 150, allowSorting: false, allowFiltering: false },
  ];

  /** Same view/approve/reject buttons as before (always visible, unconditionally). */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW', visible: () => this.permissionService.hasPermission('purchases.requisitionapprovals.view') },
    { id: 'approve', icon: 'check', labelKey: 'PURCHASE_REQUISITION.APPROVE', visible: () => this.permissionService.hasPermission('purchases.requisitionapprovals.view') },
    { id: 'reject', icon: 'close', labelKey: 'PURCHASE_REQUISITION.REJECT', visible: () => this.permissionService.hasPermission('purchases.requisitionapprovals.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'view') this.onView(wrapped);
    else if (e.actionId === 'approve') this.onApprove(wrapped);
    else if (e.actionId === 'reject') this.onReject(wrapped);
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

  mobileView(req: PurchaseRequisitionDto): void {
    this.onView({ row: { data: { id: req.id } } });
  }

  mobileApprove(req: PurchaseRequisitionDto): void {
    this.onApprove({ row: { data: req } });
  }

  mobileReject(req: PurchaseRequisitionDto): void {
    this.onReject({ row: { data: req } });
  }
}
