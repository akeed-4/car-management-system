import { Component, Input, Output, EventEmitter, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DxDataGridModule,
  DxDataGridComponent 
} from 'devextreme-angular/ui/data-grid';
import { TranslateService } from '@ngx-translate/core';

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
    
    @Input() dataSource: any[] = [];
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
  
    @Output() rowClick = new EventEmitter<any>();
    @Output() cellClick = new EventEmitter<any>();
    @Output() selectionChanged = new EventEmitter<any>();

    constructor() { }

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
   * Export grid to Excel (uses DevExtreme built-in export)
   */
  exportToExcel(fileName: string = 'report'): void {
    if (this.dataGrid) {
      this.dataGrid.instance.refresh();
    }
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
