import { Component, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { SupplierRfqService } from '../../../services/supplier-rfq.service';
import { NotificationService } from '../../../services/notification.service';
import { SupplierRfqDto } from '../../../models/supplier-rfq.model';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';

@Component({
  selector: 'app-supplier-rfq-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedDataGridComponent,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './supplier-rfq-list.component.html',
  styleUrls: ['./supplier-rfq-list.component.css']
})
export class SupplierRfqListComponent implements OnInit {
  quotations: SupplierRfqDto[] = [];

  constructor(
    private supplierRfqService: SupplierRfqService,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuotations();
  }

  loadQuotations(): void {
    this.supplierRfqService.getAll().subscribe({
      next: (quotations: any) => {
        this.quotations = Array.isArray(quotations) ? quotations : (quotations?.data ?? []);
      },
      error: (err) => {
        console.error('Error loading supplier quotations', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/supplier-quotations/new']);
  }

  onEdit(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/supplier-quotations/edit', id]);
  }

  getItemsCount(rowData: SupplierRfqDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  isDraft = (e: any): boolean => {
    return e?.row?.data?.status === 'Draft';
  };

  isPendingApproval = (e: any): boolean => {
    return e?.row?.data?.status === 'Submitted';
  };

  onSubmit(e: any): void {
    const quotation: SupplierRfqDto = e.row.data;
    this.supplierRfqService.submit(quotation.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('SUPPLIER_RFQ.SUBMIT_SUCCESS'));
        this.loadQuotations();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.SUBMIT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  onApprove(e: any): void {
    const quotation: SupplierRfqDto = e.row.data;
    this.supplierRfqService.approve(quotation.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('SUPPLIER_RFQ.APPROVE_SUCCESS'));
        this.loadQuotations();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.APPROVE_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  async onReject(e: any): Promise<void> {
    const quotation: SupplierRfqDto = e.row.data;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('SUPPLIER_RFQ.REJECT_CONFIRM_TITLE'),
      this.translateService.instant('SUPPLIER_RFQ.REJECT_CONFIRM_TEXT')
    );
    if (!result.isConfirmed) return;

    this.supplierRfqService.reject(quotation.id).subscribe({
      next: () => {
        this.notificationService.showSuccess(this.translateService.instant('SUPPLIER_RFQ.REJECT_SUCCESS'));
        this.loadQuotations();
      },
      error: (err) => {
        this.notificationService.showError(this.translateService.instant('SUPPLIER_RFQ.REJECT_ERROR') + ': ' + (err?.message || 'Unknown error'));
      }
    });
  }

  // --- Shared DataGrid: config-driven columns (same fields as before) ---
  columns: dataGridColumnDto[] = [
    { dataField: 'quotationNumber', dataType: 'string', caption: 'SUPPLIER_RFQ.QUOTATION_NUMBER' },
    { dataField: 'quotationDate', dataType: 'date', caption: 'SUPPLIER_RFQ.QUOTATION_DATE' },
    { dataField: 'vendorName', dataType: 'string', caption: 'SUPPLIER_RFQ.VENDOR' },
    { dataField: 'requisitionNumber', dataType: 'string', caption: 'SUPPLIER_RFQ.REQUISITION_NUMBER' },
    { dataField: 'items', dataType: 'number', caption: 'SUPPLIER_RFQ.ITEMS_COUNT', cellTemplate: 'itemsCountTemplate', allowSorting: false, allowFiltering: false },
    { dataField: 'totalAmount', dataType: 'number', format: 'currency', caption: 'SUPPLIER_RFQ.TOTAL_AMOUNT' },
    { dataField: 'status', dataType: 'string', caption: 'SUPPLIER_RFQ.STATUS', cellTemplate: 'statusCellTemplate' },
    // Blank caption (matches the previous buttons column, which had none) -- dataField
    // 'actions' (rather than a synthetic '__actions') so the caption-fallback in
    // SharedDataGridComponent (caption || dataField) reads as a plain word if it ever
    // surfaces, same convention as retail-delivery-list's actions column.
    { dataField: 'actions', dataType: 'string', caption: '', type: 'actions', width: 200, allowSorting: false, allowFiltering: false },
  ];

  /** Same edit/submit/approve/reject buttons, same per-row visibility rules. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'edit', icon: 'edit', labelKey: 'COMMON.EDIT' },
    { id: 'submit', icon: 'upload_file', labelKey: 'SUPPLIER_RFQ.SUBMIT', visible: (row) => this.isDraft({ row: { data: row } }) },
    { id: 'approve', icon: 'check', labelKey: 'SUPPLIER_RFQ.APPROVE', visible: (row) => this.isPendingApproval({ row: { data: row } }) },
    { id: 'reject', icon: 'close', labelKey: 'SUPPLIER_RFQ.REJECT', visible: (row) => this.isPendingApproval({ row: { data: row } }) },
  ];

  private statusTpl = viewChild<TemplateRef<any>>('statusCellTemplate');
  private itemsCountTpl = viewChild<TemplateRef<any>>('itemsCountTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    const itemsCount = this.itemsCountTpl();
    return {
      ...(status ? { statusCellTemplate: status } : {}),
      ...(itemsCount ? { itemsCountTemplate: itemsCount } : {}),
    };
  }

  onGridAction(e: SharedGridRowActionEvent): void {
    const wrapped = { row: { data: e.row } };
    if (e.actionId === 'edit') this.onEdit(wrapped);
    else if (e.actionId === 'submit') this.onSubmit(wrapped);
    else if (e.actionId === 'approve') this.onApprove(wrapped);
    else if (e.actionId === 'reject') this.onReject(wrapped);
  }

  // --- Mobile card-list rendering (reused as the SharedDataGrid's [mobileItems] view) ---
  mobileTitleOf = (q: SupplierRfqDto) => q.quotationNumber;
  mobileTrackBy = (_index: number, q: SupplierRfqDto) => q.id;

  mobileFields: MobileCardField<SupplierRfqDto>[] = [
    { label: 'SUPPLIER_RFQ.QUOTATION_DATE', value: (q) => q.quotationDate ? new Date(q.quotationDate).toLocaleDateString() : '' },
    { label: 'SUPPLIER_RFQ.VENDOR', value: (q) => q.vendorName },
    { label: 'SUPPLIER_RFQ.REQUISITION_NUMBER', value: (q) => q.requisitionNumber },
    { label: 'SUPPLIER_RFQ.ITEMS_COUNT', value: (q) => this.getItemsCount(q) },
    { label: 'SUPPLIER_RFQ.TOTAL_AMOUNT', value: (q) => q.totalAmount },
    { label: 'SUPPLIER_RFQ.STATUS', value: (q) => this.translateService.instant('SUPPLIER_RFQ.STATUS_' + q.status?.toUpperCase()) },
  ];

  mobileCanSubmit(q: SupplierRfqDto): boolean {
    return this.isDraft({ row: { data: q } });
  }

  mobileCanApproveReject(q: SupplierRfqDto): boolean {
    return this.isPendingApproval({ row: { data: q } });
  }

  mobileEdit(q: SupplierRfqDto): void {
    this.onEdit({ row: { data: { id: q.id } } });
  }

  mobileSubmit(q: SupplierRfqDto): void {
    this.onSubmit({ row: { data: q } });
  }

  mobileApprove(q: SupplierRfqDto): void {
    this.onApprove({ row: { data: q } });
  }

  mobileReject(q: SupplierRfqDto): void {
    this.onReject({ row: { data: q } });
  }
}
