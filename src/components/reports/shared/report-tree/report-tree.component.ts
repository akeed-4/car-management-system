import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeListModule, DxTreeListComponent } from 'devextreme-angular/ui/tree-list';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

export interface TreeColumn {
  dataField: string;
  caption: string;
  dataType?: 'string' | 'number' | 'date' | 'boolean';
  format?: string;
  alignment?: 'left' | 'center' | 'right';
  width?: number | string;
  visible?: boolean;
  calculateCellValue?: (rowData: any) => any;
  customizeText?: (cellInfo: any) => string;
}

@Component({
  selector: 'app-report-tree',
  standalone: true,
  imports: [
    CommonModule,
    DxTreeListModule,
    SharedMobileListComponent
  ],
  templateUrl: './report-tree.component.html',
  styleUrls: ['./report-tree.component.css']
})
export class ReportTreeComponent implements OnInit {
  private translateService = inject(TranslateService);
  private responsiveService = inject(ResponsiveService);
  isMobile = this.responsiveService.isMobile;

  @ViewChild(DxTreeListComponent, { static: false }) treeList!: DxTreeListComponent;

  @Input() dataSource: any[] = [];
  /** Report-level loading state -- see ReportGridComponent.loading's doc comment for why the
   *  mobile shared-mobile-list needs this explicitly (there's no separate remote-mode paging
   *  state here to fall back on the way ReportGridComponent has). */
  @Input() loading = false;
  @Input() columns: TreeColumn[] = [];
  @Input() keyExpr: string = 'id';
  @Input() parentIdExpr: string = 'parentId';
  /** The parentIdExpr value that marks a row as a root node (DevExtreme's own default for plain
   *  tree data). Bound explicitly rather than left to the DevExtreme default so every consumer's
   *  root rows have to agree on this value on purpose -- see BalanceSheetReport's synthetic
   *  section rows in account-report.service.ts, which set parentId to this same value. */
  @Input() rootValue: number = 0;
  @Input() hasItemsExpr: string = 'hasChildren';

  /** Omit to auto-detect from the document's direction -- see ReportGridComponent.rtlEnabled's
   *  doc comment for the identical rationale: dx-tree-list computes column/cell positions itself
   *  rather than through CSS table layout, so without setting DevExtreme's own rtlEnabled option
   *  the widget lays out columns left-to-right internally while the surrounding page mirrors
   *  visually, drifting headers and data cells out of alignment in Arabic/RTL. */
  @Input() rtlEnabled?: boolean;

  get resolvedRtl(): boolean {
    return this.rtlEnabled ?? document?.documentElement?.dir === 'rtl';
  }

  @Input() showBorders: boolean = true;
  @Input() showRowLines: boolean = true;
  @Input() showColumnLines: boolean = true;
  @Input() rowAlternationEnabled: boolean = true;
  @Input() allowColumnResizing: boolean = true;
  @Input() allowColumnReordering: boolean = true;
  @Input() allowSorting: boolean = true;
  @Input() allowFiltering: boolean = true;
  @Input() autoExpandAll: boolean = false;
  @Input() expandNodesOnFiltering: boolean = true;
  @Input() height: string = '600px';
  @Input() showSummary: boolean = true;
  @Input() summaryItems: any[] = [];
  /** Empty-state text -- see ReportGridComponent.noDataText's doc comment for the same
   *  "apply filters" vs "no results" gating convention. */
  @Input() noDataText: string = '';

  get resolvedNoDataText(): string {
    return this.translateService.instant(this.noDataText || 'REPORTS.APPLY_FILTER_PROMPT');
  }

  /** Mobile card list rows -- this component is always given the full flattened dataset up front
   *  (no remote/paged mode, see exportRows' doc comment), so unlike ReportGridComponent's
   *  remote-mode caveat, every row is always available here. */
  get mobileData(): any[] {
    return this.dataSource ?? [];
  }

  /** First visible column, indented per row `level` so the tree's hierarchy (section headers vs.
   *  nested accounts) survives being flattened into a plain mobile card list -- same indentation
   *  convention as formattedCellValue's Excel/PDF export. */
  get mobileTitleOf(): (row: any) => string {
    const first = this.visibleColumns[0];
    return (row: any) => {
      const value = first ? String(row?.[first.dataField] ?? '') : '';
      const level = Number(row?.['level'] ?? 0);
      return '  '.repeat(Math.max(0, level)) + value;
    };
  }

  mobileTrackByFn = (index: number) => index;

  /** Derives SharedMobileListComponent's field config from the same `columns` already driving the
   *  desktop tree-list -- see ReportGridComponent.mobileFields' doc comment for the identical
   *  rationale (one column definition drives both renderings). */
  get mobileFields(): MobileListFieldDto<any>[] {
    const [, ...rest] = this.visibleColumns;
    return rest.map(col => ({
      label: col.caption,
      value: (row: any) => col.calculateCellValue ? col.calculateCellValue(row) : row?.[col.dataField],
      type: col.dataType === 'number' ? 'number' : col.dataType === 'date' ? 'date' : 'text',
    }));
  }

  @Output() rowClick = new EventEmitter<any>();
  @Output() cellClick = new EventEmitter<any>();
  @Output() rowExpanding = new EventEmitter<any>();
  @Output() rowCollapsing = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {
    this.setupDefaultSummary();
  }

  /**
   * Setup default summary items for numeric columns
   */
  private setupDefaultSummary(): void {
    if (this.showSummary && this.summaryItems.length === 0) {
      this.summaryItems = this.columns
        .filter(col => col.dataType === 'number')
        .map(col => ({
          column: col.dataField,
          summaryType: 'sum',
          valueFormat: col.format || 'decimal',
          displayFormat: `{0}`
        }));
    }
  }

  /**
   * Handle row click event
   */
  onRowClick(e: any): void {
    this.rowClick.emit(e.data);
  }

  /**
   * Handle cell click event
   */
  onCellClick(e: any): void {
    this.cellClick.emit({
      data: e.data,
      column: e.column.dataField,
      value: e.value
    });
  }

  /**
   * Handle row expanding event
   */
  onRowExpanding(e: any): void {
    this.rowExpanding.emit(e.key);
  }

  /**
   * Handle row collapsing event
   */
  onRowCollapsing(e: any): void {
    this.rowCollapsing.emit(e.key);
  }

  /**
   * Expand all nodes
   */
  expandAll(): void {
    this.treeList?.instance.forEachNode((node: any) => this.treeList!.instance.expandRow(node.key));
  }

  /**
   * Collapse all nodes
   */
  collapseAll(): void {
    this.treeList?.instance.forEachNode((node: any) => this.treeList!.instance.collapseRow(node.key));
  }

  /**
   * DevExtreme has no exportTreeList API (unlike exportDataGrid/exportPivotGrid -- see
   * devextreme/excel_exporter and devextreme/pdf_exporter, neither of which export a TreeList
   * variant in this or any released DevExtreme version), so Balance Sheet (the only report-tree
   * consumer) can't reuse ReportGridComponent's export pattern verbatim. Both exports below build
   * the file directly from `dataSource`/`columns` -- the same rows already on screen, since this
   * component is always given the full flattened dataset up front (no remote/paged mode like
   * ReportGridComponent) -- indenting the first visible column per row's `level` to preserve the
   * tree's visual hierarchy in a flat sheet/table.
   */
  private get exportRows(): any[] {
    return this.dataSource ?? [];
  }

  private get visibleColumns(): TreeColumn[] {
    return this.columns.filter(c => c.visible !== false);
  }

  private formattedCellValue(row: any, column: TreeColumn): string {
    const raw = column.calculateCellValue ? column.calculateCellValue(row) : row[column.dataField];
    const text = column.customizeText
      ? column.customizeText({ value: raw })
      : (raw ?? '');
    if (column === this.visibleColumns[0]) {
      const level = Number(row['level'] ?? 0);
      return '  '.repeat(Math.max(0, level)) + text;
    }
    return String(text);
  }

  /**
   * Export tree data to Excel via exceljs directly (see this class's exportRows doc comment).
   */
  exportToExcel(fileName: string = 'report'): void {
    const columns = this.visibleColumns;
    const rows = this.exportRows;
    import('exceljs').then(async (ExcelJS) => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(fileName);
      worksheet.columns = columns.map(c => ({ header: this.getCaption(c.caption), key: c.dataField }));
      for (const row of rows) {
        const rowValues: Record<string, string> = {};
        for (const column of columns) {
          rowValues[column.dataField] = this.formattedCellValue(row, column);
        }
        worksheet.addRow(rowValues);
      }
      worksheet.getRow(1).font = { bold: true };
      const buffer = await workbook.xlsx.writeBuffer();
      const { saveAs } = await import('file-saver');
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
    });
  }

  /**
   * Export tree data to PDF. No autotable/grid plugin is installed in this project, so the table
   * is drawn manually: a header row, then one row per data row, columns laid out at fixed x
   * offsets sized off the page width, paginating (new page + re-drawn header) once rows would run
   * past the bottom margin.
   */
  exportToPdf(fileName: string = 'report'): void {
    const columns = this.visibleColumns;
    const rows = this.exportRows;
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const marginX = 10;
      const marginTop = 15;
      const marginBottom = 15;
      const rowHeight = 8;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const colWidth = (pageWidth - marginX * 2) / Math.max(columns.length, 1);

      const drawHeader = (y: number): number => {
        doc.setFont('helvetica', 'bold');
        columns.forEach((column, i) => {
          doc.text(this.getCaption(column.caption), marginX + i * colWidth, y);
        });
        doc.setFont('helvetica', 'normal');
        return y + rowHeight;
      };

      let y = drawHeader(marginTop);
      for (const row of rows) {
        if (y > pageHeight - marginBottom) {
          doc.addPage();
          y = drawHeader(marginTop);
        }
        columns.forEach((column, i) => {
          const text = this.formattedCellValue(row, column);
          doc.text(String(text), marginX + i * colWidth, y, { maxWidth: colWidth - 2 });
        });
        y += rowHeight;
      }

      doc.save(`${fileName}.pdf`);
    });
  }

  /**
   * Get translated caption for column
   */
  getCaption(captionKey: string): string {
    return this.translateService.instant(captionKey);
  }
}
