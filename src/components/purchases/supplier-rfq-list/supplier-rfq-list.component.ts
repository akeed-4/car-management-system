import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DxDataGridModule, DxButtonModule, DxTemplateModule } from 'devextreme-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SupplierRfqService } from '../../../services/supplier-rfq.service';
import { NotificationService } from '../../../services/notification.service';
import { SupplierRfqDto } from '../../../models/supplier-rfq.model';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardListComponent, MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';

@Component({
  selector: 'app-supplier-rfq-list',
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
  templateUrl: './supplier-rfq-list.component.html',
  styleUrls: ['./supplier-rfq-list.component.css']
})
export class SupplierRfqListComponent implements OnInit {
  quotations: SupplierRfqDto[] = [];
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

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

  // --- Mobile card-list rendering ---
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
