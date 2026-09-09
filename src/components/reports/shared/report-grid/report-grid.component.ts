import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DxDataGridModule,
  DxDataGridComponent
} from 'devextreme-angular/ui/data-grid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { ResponsiveService } from '../../../../services/responsive.service';
import { SharedMobileListComponent } from '../../../shared/shared-mobile-list/shared-mobile-list.component';
import { MobileListFieldDto } from '../../../shared/shared-mobile-list/shared-mobile-list.model';

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
        TranslateModule,
        SharedMobileListComponent,
    ],
    templateUrl: './report-grid.component.html',
    styleUrls: ['./report-grid.component.css']
})
export class ReportGridComponent implements OnInit, OnChanges {
    private translateService = inject(TranslateService);
    private responsiveService = inject(ResponsiveService);
    isMobile = this.responsiveService.isMobile;

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

    /** Empty-state text shown when the grid has no rows. Callers pass the "apply filters to see
     *  data" prompt before the first search, and a "no results" message after a search returns
     *  nothing -- see this input's usage in report-container-driven report screens. */
    @Input() noDataText: string = '';

    get resolvedNoDataText(): string {
        return this.translateService.instant(this.noDataText || 'REPORTS.APPLY_FILTER_PROMPT');
    }

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

    constructor() {
        // Covers switching to mobile (e.g. resizing the window) after the remote store was
        // already set and desktop-loaded -- ngOnChanges only re-fires loadMoreMobileRows when
        // `remoteDataSource` itself is reassigned (a new search), not on a viewport change, so
        // without this the mobile card list would stay empty until the next Apply Filter.
        effect(() => {
            if (this.isMobile() && this.isRemoteMode && this.remoteMobileRows.length === 0 && !this.remoteMobileLoading) {
                this.loadMoreMobileRows();
            }
        });
    }

    ngOnInit(): void {
        this.setupDefaultSummary();
        this.gridDataSource = this.remoteDataSource ?? this.dataSource;
    }

    /**
     * `[dataSource]` binding target for the inner dx-data-grid: remote store when provided, else
     * the plain array. This used to be a `get gridDataSource()` getter re-evaluated by the
     * template on every change-detection check. DevExtreme's Angular wrapper only attaches its
     * `IterableDiffer` (the mechanism that detects a reassigned `dataSource` array and repaints)
     * from `ngOnChanges`, keyed off a real `@Input`'s `SimpleChange` -- a getter's return value
     * changing is invisible to that, since Angular has no change record for it. That silently
     * broke/detached the differ across ticks, so after Apply Filter reassigned `reportData`, the
     * grid stayed on stale rows until some unrelated event (focusing another field) forced a
     * fresh Angular check that happened to re-read the getter. Recomputing into a plain field
     * here, inside ngOnChanges, makes it a normal `@Input`-shaped value change again so DevExtreme
     * detects and repaints it immediately.
     */
    gridDataSource: any;

    ngOnChanges(changes: SimpleChanges): void {
        if ('dataSource' in changes || 'remoteDataSource' in changes) {
            this.gridDataSource = this.remoteDataSource ?? this.dataSource;
        }
        if ('remoteDataSource' in changes && this.remoteDataSource) {
            this.resetRemoteMobileRows();
            if (this.isMobile()) this.loadMoreMobileRows();
        }
    }

    /** True when the grid is bound to a remote CustomStore/DataSource rather than a plain array. */
    get isRemoteMode(): boolean {
        return !!this.remoteDataSource;
    }

    /** Remote-mode mobile paging state: SharedMobileListComponent expects a resolved array (not a
     *  DevExtreme store), so in remote mode this component pages through the CustomStore's own
     *  `load()` directly -- the same API DevExtreme itself calls internally -- one page at a time,
     *  independently of the desktop dx-data-grid (which isn't even rendered on mobile). Reset
     *  whenever the store itself changes (a new report search) or the desktop grid is asked to
     *  refresh, so mobile and desktop always show the same result set. */
    private remoteMobileRows: any[] = [];
    private remoteMobileTotalCount = 0;
    remoteMobileLoading = false;

    /** Rows for the mobile card list: the plain array directly in array mode, or the
     *  paged-in-so-far rows loaded from the remote store in remote mode (see loadMoreMobileRows). */
    get mobileData(): any[] {
        return this.isRemoteMode ? this.remoteMobileRows : this.dataSource;
    }

    /** Total row count on the server for remote mode -- lets SharedMobileListComponent's own
     *  "load more" affordance show once more rows exist -- left undefined in array mode where the
     *  full set is already in `dataSource` (mirrors mobileData's mode split above). */
    get mobileTotalCount(): number | undefined {
        return this.isRemoteMode ? this.remoteMobileTotalCount : undefined;
    }

    /** Loads the next page of the remote store into the mobile card list. Called once when the
     *  grid (re)enters remote mode and on every SharedMobileListComponent `pageChange`. Uses the
     *  store's own `load()` -- the same method DevExtreme's grid calls internally for
     *  remoteOperations -- with plain skip/take so this stays independent of whatever sort/filter
     *  state the (unrendered, on mobile) desktop grid instance may hold. Only CustomStore's
     *  `load(options)` accepts a plain skip/take object this way -- DataSource.load() takes no
     *  arguments and pages via a separate pageIndex()/paginate() API, so this only runs for an
     *  actual CustomStore (every current report screen's remoteDataSource, per
     *  ReportRemoteDataSource's own consumers today); a DataSource is left for the desktop grid to
     *  drive as before, and the mobile list simply shows nothing for that (currently unused) case. */
    loadMoreMobileRows(): void {
        if (!this.remoteDataSource || this.remoteMobileLoading) return;
        if (!(this.remoteDataSource instanceof CustomStore)) return;
        this.remoteMobileLoading = true;
        const skip = this.remoteMobileRows.length;
        Promise.resolve(
            this.remoteDataSource.load({ skip, take: this.remotePageSize } as any),
        ).then((result: any) => {
            const rows = Array.isArray(result) ? result : (result?.data ?? []);
            const totalCount = Array.isArray(result) ? rows.length : (result?.totalCount ?? rows.length);
            this.remoteMobileRows = skip === 0 ? rows : [...this.remoteMobileRows, ...rows];
            this.remoteMobileTotalCount = totalCount;
        }).catch(() => {
            // Mirrors the desktop grid's own remote-store error handling (report-data-source.service.ts
            // already turns a failed load into a real Error) -- the mobile list's emptyMessage/no-data
            // state covers a load that never populated any rows, so nothing further to show here.
        }).finally(() => {
            this.remoteMobileLoading = false;
        });
    }

    /** Resets remote-mode mobile paging so the next loadMoreMobileRows() call starts a fresh
     *  result set instead of appending to a stale one -- called whenever the store itself is
     *  replaced (a new report search) or refresh() is invoked. */
    private resetRemoteMobileRows(): void {
        this.remoteMobileRows = [];
        this.remoteMobileTotalCount = 0;
    }

    /** First visible column is used as each mobile card's title (mirrors how the desktop grid
     *  puts the report's primary key/identifying column first, e.g. account code, entry number). */
    get mobileTitleOf(): (row: any) => string {
        const first = this.columns.find(c => c.visible !== false);
        return (row: any) => (first ? String(row?.[first.dataField] ?? '') : '');
    }

    mobileTrackByFn = (index: number) => index;

    /** Derives SharedMobileListComponent's field config from the same `columns` already driving
     *  the desktop dx-data-grid, so report screens don't need to define a second, parallel field
     *  list -- one `columns` array now drives both renderings. The title column (see mobileTitleOf)
     *  is skipped since it's already shown as the card heading. */
    get mobileFields(): MobileListFieldDto<any>[] {
        const visible = this.columns.filter(c => c.visible !== false);
        const [, ...rest] = visible;
        return rest.map(col => ({
            label: col.caption,
            value: (row: any) => col.calculateCellValue ? col.calculateCellValue(row) : row?.[col.dataField],
            // Not col.format: that's a DevExtreme format string (e.g. '#,##0.00'), incompatible
            // with the mobile list's Angular DecimalPipe/DatePipe -- omitted so it falls back to
            // their own sensible defaults ('1.0-2' / 'yyyy-MM-dd') instead of rendering garbled.
            type: col.dataType === 'number' ? 'number' : col.dataType === 'date' ? 'date' : 'text',
        }));
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
   * Export grid to PDF using DevExtreme's built-in `exportDataGrid` (same dynamic-import pattern
   * as tenant-list.component.ts's exportPdf, the closest in-house precedent). Same
   * unpaged-in-remote-mode behavior as exportToExcel above.
   */
  exportToPdf(fileName: string = 'report'): void {
    const component = this.dataGrid?.instance;
    if (!component) return;
    Promise.all([import('jspdf'), import('devextreme/pdf_exporter')]).then(([jsPDFModule, { exportDataGrid }]) => {
      const doc = new jsPDFModule.jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component,
      }).then(() => {
        doc.save(`${fileName}.pdf`);
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
    if (this.isRemoteMode) {
      this.resetRemoteMobileRows();
      if (this.isMobile()) this.loadMoreMobileRows();
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
