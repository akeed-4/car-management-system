import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTreeListModule } from 'devextreme-angular/ui/tree-list';
import { TranslateService } from '@ngx-translate/core';

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
    DxTreeListModule
  ],
  templateUrl: './report-tree.component.html',
  styleUrls: ['./report-tree.component.css']
})
export class ReportTreeComponent implements OnInit {
  private translateService = inject(TranslateService);
  
  @Input() dataSource: any[] = [];
  @Input() columns: TreeColumn[] = [];
  @Input() keyExpr: string = 'id';
  @Input() parentIdExpr: string = 'parentId';
  @Input() hasItemsExpr: string = 'hasChildren';
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
          displayFormat: `{0}`,
          showInColumn: col.dataField
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
    // Will be implemented with ViewChild reference
  }

  /**
   * Collapse all nodes
   */
  collapseAll(): void {
    // Will be implemented with ViewChild reference
  }

  /**
   * Get translated caption for column
   */
  getCaption(captionKey: string): string {
    return this.translateService.instant(captionKey);
  }
}
