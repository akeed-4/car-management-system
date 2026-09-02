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
     *  collide with an unrelated key some other part of the app happens to also store under. */
    get resolvedStateStorageKey(): string {
        return `reportGrid_${this.stateStorageKey}`;
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
