import { ChangeDetectorRef, Component, OnInit, TemplateRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CarsReceiptNoteService } from '../../../services/cars-receipt-note.service';
import { CarsReceiptNoteDto } from '../../../models/cars-receipt-note.model';
import { DocumentStatusBadgeComponent } from '../../shared/document-status-badge/document-status-badge.component';
import { ResponsiveService } from '../../../services/responsive.service';
import { MobileCardField } from '../../shared/mobile-card-list/mobile-card-list.component';
import {
  SharedDataGridComponent,
  SharedGridRowActionEvent,
} from '../../shared/shared-data-grid/shared-data-grid.component';
import { dataGridColumnDto, sharedGridRowActionDto } from '../../../models/grid.model';
import { HasPermissionDirective } from '../../shared/permission.directive';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-cars-receipt-note-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    DocumentStatusBadgeComponent,
    SharedDataGridComponent,
    HasPermissionDirective
  ],
  templateUrl: './cars-receipt-note-list.component.html',
  styleUrls: ['./cars-receipt-note-list.component.css']
})
export class CarsReceiptNoteListComponent implements OnInit {
  receiptNotes: CarsReceiptNoteDto[] = [];
  private responsiveService = inject(ResponsiveService);
  private translateService = inject(TranslateService);
  private permissionService = inject(PermissionService);
  isMobile = this.responsiveService.isMobile;

  constructor(
    private carsReceiptNoteService: CarsReceiptNoteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReceiptNotes();
  }

  loadReceiptNotes(): void {
    this.carsReceiptNoteService.getAll().subscribe({
      next: (notes: any) => {
        this.receiptNotes = Array.isArray(notes) ? notes : (notes?.data ?? []);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading car receipt notes', err);
      }
    });
  }

  onCreateNew(): void {
    this.router.navigate(['/purchases/receipt-notes/new']);
  }

  onView(e: any): void {
    const id = e.row.data.id;
    this.router.navigate(['/purchases/receipt-notes/view', id]);
  }

  getItemsCount(rowData: CarsReceiptNoteDto): number {
    return rowData.items ? rowData.items.length : 0;
  }

  /** Status badge cell, ported via cellTemplates (same app-document-status-badge as before). */
  private statusTpl = viewChild<TemplateRef<any>>('statusTemplate');

  get cellTemplates(): Record<string, TemplateRef<any>> {
    const status = this.statusTpl();
    return status ? { statusTemplate: status } : {};
  }

  /** Config-driven columns -- same fields/order as before (i18n keys). */
  columns: dataGridColumnDto[] = [
    { dataField: 'grnNumber', dataType: 'string', caption: 'CARS_RECEIPT_NOTE.GRN_NUMBER' },
    { dataField: 'receiptDate', dataType: 'date', caption: 'CARS_RECEIPT_NOTE.RECEIPT_DATE' },
    { dataField: 'poNumber', dataType: 'string', caption: 'CARS_RECEIPT_NOTE.PO_NUMBER' },
    { dataField: 'items', dataType: 'string', caption: 'CARS_RECEIPT_NOTE.ITEMS_COUNT', calculateCellValue: this.getItemsCount },
    { dataField: 'status', dataType: 'string', caption: 'CARS_RECEIPT_NOTE.STATUS', cellTemplate: 'statusTemplate' },
    { dataField: 'actions', dataType: 'string', type: 'actions', caption: '', width: 90, allowSorting: false, allowFiltering: false },
  ];

  /** Same single view button as before. */
  rowActions: sharedGridRowActionDto[] = [
    { id: 'view', icon: 'find', labelKey: 'COMMON.VIEW', visible: () => this.permissionService.hasPermission('purchases.receipts.view') },
  ];

  onGridAction(e: SharedGridRowActionEvent): void {
    if (e.actionId === 'view') this.onView({ row: { data: e.row } });
  }

  // --- Mobile card-list rendering ---
  mobileTitleOf = (note: CarsReceiptNoteDto) => note.grnNumber;
  mobileTrackBy = (_index: number, note: CarsReceiptNoteDto) => note.id;

  mobileFields: MobileCardField<CarsReceiptNoteDto>[] = [
    { label: 'CARS_RECEIPT_NOTE.RECEIPT_DATE', value: (note) => note.receiptDate ? new Date(note.receiptDate).toLocaleDateString() : '' },
    { label: 'CARS_RECEIPT_NOTE.PO_NUMBER', value: (note) => note.poNumber },
    { label: 'CARS_RECEIPT_NOTE.ITEMS_COUNT', value: (note) => this.getItemsCount(note) },
    { label: 'CARS_RECEIPT_NOTE.STATUS', value: (note) => this.translateService.instant('DOCUMENT_LIFECYCLE.STATUS_' + (note.status ?? 'DRAFT').toUpperCase()) },
  ];

  mobileView(note: CarsReceiptNoteDto): void {
    this.router.navigate(['/purchases/receipt-notes/view', note.id]);
  }
}
