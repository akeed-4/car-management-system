import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxDataGridModule,
  DxDataGridComponent
} from 'devextreme-angular/ui/data-grid';
import { TranslateService } from '@ngx-translate/core';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';

export interface GridColumn {
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

/** Accepted shapes for `remoteDataSource` -- a ready CustomStore, or a DataSource wrapping one. */
export type ReportRemoteDataSource = CustomStore | DataSource;

@Component({
    selector: 'app-report-grid',
    standalone: true,
    imports: [
        CommonModule,
        DxDataGridModule,
    
    ],
    templateUrl: './report-grid.component.html',
    styleUrls: ['./report-grid.component.css']
})
export class ReportGridComponent implements OnInit {
    private translateService = inject(TranslateService);

    /** Plain-array mode (default, backward compatible with every existing report screen). */
    @Input() dataSource: any[] = [];
    /**
     * Remote-operations mode: when set, this CustomStore/DataSource drives the grid instead of
     * `dataSource`, and `remoteOperations` (filtering/sorting/paging/grouping/summary) is enabled
     * so DevExtreme delegates all of those to the store's `load()` -- see
     * report-data-source.service.ts for the shared helper that builds one of these against a
     * `DataSourceLoadOptions` backend endpoint. Screens not yet converted to server-side paging
     * simply never set this and keep working exactly as before.
     */
    @Input() remoteDataSource?: ReportRemoteDataSource;
    @Input() columns: GridColumn[] = [];
    @Input() keyExpr: string = 'id';
    @ViewChild(DxDataGridComponent, { static: false }) dataGrid!: DxDataGridComponent;

    /** Omit to auto-detect from the document's direction (matches SharedDataGridComponent's own
     *  resolvedRtl -- the same fallback used app-wide). Explicitly setting DevExtreme's own
     *  rtlEnabled option (not just wrapping the grid in a dir="rtl" container) matters: dx-data-grid
     *  computes column/cell positions itself rather than through simple CSS table layout, so without
     *  this the widget lays out columns left-to-right internally while the surrounding page mirrors
     *  the container visually -- headers (drawn per the LTR internal order) and virtualized data
     *  cells can then drift out of alignment column-by-column even though the columns config itself
     *  is correct. This @Input previously existed only in the template (`[rtlEnabled]="rtlEnabled"`)
     *  with no matching class member, so it silently resolved to undefined/false on every report
     *  using this shared grid. */
    @Input() rtlEnabled?: boolean;

    /** Resolved value actually passed to dx-data-grid -- see rtlEnabled's doc comment. */
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
    @Input() allowGrouping: boolean = false;
    @Input() showGroupPanel: boolean = false;
    @Input() showSummary: boolean = true;
    @Input() height: string = '600px';
    @Input() summaryItems: any[] = [];
    /** Page size used only in remote-operations mode (client-side array mode is unaffected). */
    @Input() remotePageSize: number = 20;
    /**
     * Distinguishes this grid's persisted column state (order/width/visibility, via DevExtreme
     * stateStoring) from every other report's. Every consumer of this shared component previously
     * persisted to the exact same hardcoded localStorage key ("reportGridState") regardless of
     * which report it was -- so reordering/resizing a column on one report (e.g. General Journal)
     * would silently corrupt another report's column layout the next time it loaded (e.g. Account
     * Statement), since DevExtreme would try to restore a state blob shaped for a completely
     * different set of columns. State storing is now opt-in per report: pass a key unique to this
     * screen (e.g. `'general-journal'`) to persist column customization scoped to it; omit it to
     * leave state storing off entirely, same as if this feature never existed for that screen.
     */
    @Input() stateStorageKey: string = '';

    /** Full localStorage key actually passed to dxo-state-storing -- prefixed so it can never
     *  collide with an unrelated key some other part of the app happens to also store under, and
     *  suffixed with a signature of the current columns' dataFields (order included). Without that
     *  signature, a layout persisted under this key for an OLDER shape of `columns` (a field added,
     *  removed, or reordered in a later code change) gets silently restored on top of the CURRENT
     *  column definitions -- DevExtreme reapplies the old order/visibility array positionally, so
     *  headers (rendered from the current `columns` input) and data cells (rendered per the
     *  restored, now-mismatched order) drift out of alignment column-by-column -- exactly the kind
     *  of header/data shift this state-storing feature already caused once before across reports
     *  sharing one hardcoded key (see this @Input()'s doc comment). Folding the field list into the
     *  key means any such change naturally invalidates the incompatible saved state -- the browser's
     *  old entry is simply never looked up again -- instead of corrupting the grid until a user
     *  manually clears localStorage. */
    get resolvedStateStorageKey(): string {
        const signature = this.columns.map(c => c.dataField).join('|');
        let hash = 0;
        for (let i = 0; i < signature.length; i++) {
            hash = (hash * 31 + signature.charCodeAt(i)) | 0;
        }
        return `reportGrid_${this.stateStorageKey}_${hash}`;
    }

    @Output() rowClick = new EventEmitter<any>();
    @Output() cellClick = new EventEmitter<any>();
    @Output() selectionChanged = new EventEmitter<any>();

    constructor() { }

    ngOnInit(): void {
        this.setupDefaultSummary();
    }

    /** True when the grid is bound to a remote CustomStore/DataSource rather than a plain array. */
    get isRemoteMode(): boolean {
        return !!this.remoteDataSource;
    }

    /** `[dataSource]` binding target: remote store when provided, else the plain array as before. */
    get gridDataSource(): any {
        return this.remoteDataSource ?? this.dataSource;
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
                    displayFormat: `{0}`,
                    alignByColumn: true
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
     * Handle selection changed event
     */
    onSelectionChanged(e: any): void {
        this.selectionChanged.emit(e.selectedRowsData);
    }

  /**
   * Export grid to Excel using DevExtreme's built-in `exportDataGrid` (same dynamic-import
   * pattern as tenant-list.component.ts's exportExcel, the closest in-house precedent). In
   * remote-operations mode this re-queries the store unpaged so the export covers every row
   * matching the current filters/sort, not just the currently-loaded page -- DevExtreme does
   * this automatically for a CustomStore-backed grid as long as `selectedRowsOnly` is left
   * false, which is the default here.
   */
  exportToExcel(fileName: string = 'report'): void {
    const component = this.dataGrid?.instance;
    if (!component) return;
    import('devextreme/excel_exporter').then(({ exportDataGrid }) => {
      import('exceljs').then(async (ExcelJS) => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(fileName);
        exportDataGrid({
          component,
          worksheet,
        }).then(() => {
          workbook.xlsx.writeBuffer().then((buffer: BlobPart) => {
            import('file-saver').then(({ saveAs }) => {
              saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
            });
          });
        });
      });
    });
  }

  /**
   * Refresh grid data
   */
  refresh(): void {
    if (this.dataGrid) {
      this.dataGrid.instance.refresh();
    }
  }

  /**
   * Get grid instance
   */
  getInstance(): any {
    return this.dataGrid?.instance;
  }

  /**
   * Get translated caption for column
   */
  getCaption(captionKey: string): string {
    return this.translateService.instant(captionKey);
  }
}
