import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DxDataGridModule, DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ResponsiveService } from '../../../services/responsive.service';
import { ROW_ACTION_ICON_FALLBACK, ROW_ACTION_ICON_PATHS } from './row-action-icons';
import {
  MobileCardListComponent,
  MobileCardField,
} from '../mobile-card-list/mobile-card-list.component';
import {
  dataGridColumnDto,
  gridMobileSettingDto,
  gridWebSettingDto,
  sharedGridRowActionDto,
} from '../../../models/grid.model';

/** Emitted when the pager changes and remoteOperations is enabled. */
export interface SharedGridPageEvent {
  pageIndex: number;
  pageSize: number;
}

/** Emitted when a column sort changes and remoteOperations is enabled. */
export interface SharedGridSortEvent {
  field: string;
  direction: 'asc' | 'desc';
}

/** Payload of the rowAction output. */
export interface SharedGridRowActionEvent {
  actionId: string;
  row: any;
}

/**
 * Shared DataGrid for every Index/List screen (parent, child, document and
 * lookup lists). Wraps the DevExtreme dx-data-grid so all screens share ONE
 * implementation of:
 *   - column rendering (config-driven via the existing dataGridColumnDto)
 *   - row actions (built-in Material-icon action buttons + status badges)
 *   - pagination / sorting / search-panel / filter-row / header-filter /
 *     column-chooser chrome, sized from the existing gridWebSettingDto /
 *     gridMobileSettingDto
 *   - responsive behavior: on mobile it renders the existing shared
 *     app-mobile-card-list instead of clipped grid columns (single source of
 *     truth -- screens no longer duplicate the @if (isMobile()) swap)
 *   - loading overlay + localized empty state
 *
 * The screen keeps owning data loading, filters, permissions (it passes the
 * already-authorized rowActions), navigation and business actions. The grid
 * itself stays completely generic.
 */
@Component({
  selector: 'app-shared-data-grid',
  standalone: true,
  imports: [
    CommonModule,
    DxDataGridModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MobileCardListComponent,
  ],
  templateUrl: './shared-data-grid.component.html',
  styleUrl: './shared-data-grid.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedDataGridComponent implements OnChanges, OnDestroy {
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  protected responsive = inject(ResponsiveService);

  /** Re-evaluated by template bindings so translated captions refresh on language change. */
  protected langVersion = 0;
  private langSub = this.translate.onLangChange.subscribe(() => {
    this.langVersion++;
    this.cdr.markForCheck();
  });

  @ViewChild(DxDataGridComponent, { static: false }) grid?: DxDataGridComponent;

  // ---- Data & configuration -------------------------------------------------
  /** Array, Observable or DevExtreme CustomStore -- passed straight through. */
  @Input({ required: true }) dataSource: unknown = [];
  @Input() columns: dataGridColumnDto[] = [];
  /** Already-authorized actions (the screen applies its permission logic). */
  @Input() rowActions: sharedGridRowActionDto[] = [];
  @Input() keyExpr: string | string[] = 'id';
  /** Explicit loading flag; renders the shared overlay above the grid. */
  @Input() loading = false;

  // ---- Chrome toggles -------------------------------------------------------
  @Input() showSearchPanel = true;
  @Input() showFilterRow = true;
  @Input() showHeaderFilter = true;
  @Input() showColumnChooser = true;
  @Input() searchPlaceholder?: string;
  /** i18n key or literal shown when the grid has no rows. */
  @Input() noDataText = 'COMMON.NO_DATA';

  // ---- Paging ---------------------------------------------------------------
  /** Omit to use the shared web/mobile defaults from grid.*SettingDto. */
  @Input() pageSize?: number;
  @Input() allowedPageSizes?: number[];
  /**
   * Server-side mode: the screen owns pageIndex/pageSize/totalCount and calls
   * its API from the pageChange/sortChange outputs. Client-side grids leave
   * this off and let DevExtreme page locally exactly as before.
   */
  @Input() remoteOperations = false;
  @Input() totalCount = 0;
  @Input() pageIndex?: number;

  // ---- Look & feel ----------------------------------------------------------
  /** Omit to default per breakpoint (600px web / auto-height mobile). */
  @Input() height: number | string | undefined;
  /** Omit to follow the document direction maintained by app.component.ts. */
  @Input('rtlEnabled') rtlEnabledInput?: boolean;
  /** Opt-in persisted layout state (column order/visibility) per screen. */
  @Input() stateStoringKey?: string;
  /**
   * Pass-through for the underlying DevExtreme `remoteOperations` option: when
   * true, filtering/sorting/grouping/paging are all delegated to the data
   * source (CustomStore load). The screen keeps receiving pageChange/sortChange
   * events via the existing [remoteOperations] input.
   */
  @Input() dxRemoteOperations?: boolean;
  /** Shows the drag-a-column-here grouping panel (large operational lists). */
  @Input() showGroupPanel = false;
  /** When set, enables DevExtreme's built-in toolbar export with this file name. */
  @Input() exportFileName?: string;
  /** Enables virtual scrolling (large lists). */
  @Input() scrollingMode: 'default' | 'virtual' = 'default';
  /** dxo-summary total items: [{ column, summaryType, displayFormat?, ... }] */
  @Input() summaryItems: any[] = [];

  // ---- Row selection --------------------------------------------------------
  @Input() selectionMode: 'none' | 'single' | 'multiple' = 'none';
  /** Pre-selected row keys (e.g. dropdown-box integration). */
  @Input() selectedRowKeys?: any[];

  // ---- Mobile card rendering -------------------------------------------------
  /** When false (or without mobileFields), mobile renders like desktop did before. */
  @Input() enableMobileCards = true;
  /** Mirrored rows for the card list (same dataset the grid would render). */
  @Input() mobileItems: any[] = [];
  @Input() mobileFields?: MobileCardField<any>[];
  @Input() mobileTitleOf?: (item: any) => string;
  @Input() mobileTrackBy?: (index: number, item: any) => unknown;
  /** Optional projected per-row actions markup (<ng-template let-item>...). */
  @ContentChild(TemplateRef) mobileActionsTemplate?: TemplateRef<{ $implicit: any }>;

  /**
   * Generic custom cell templates, keyed by the column's `cellTemplate` name.
   * Each entry receives the DevExtreme cellInfo ($implicit). This keeps
   * screen-specific cell rendering (chips, progress bars, ...) config-driven
   * without duplicating grid chrome per screen.
   */
  @Input() cellTemplates?: Record<string, TemplateRef<any>>;

  // ---- Outputs ----------------------------------------------------------------
  @Output() pageChange = new EventEmitter<SharedGridPageEvent>();
  @Output() sortChange = new EventEmitter<SharedGridSortEvent>();
  @Output() rowAction = new EventEmitter<SharedGridRowActionEvent>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowDblClick = new EventEmitter<any>();
  @Output() selectionChanged = new EventEmitter<any[]>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      // New array identity so dx-data-grid re-renders translated captions.
      this.columns = [...this.columns];
    }
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }

  // ---- Resolved option helpers -------------------------------------------------
  protected get resolvedRtl(): boolean {
    // Preserve behavior: follow the document direction that app.component.ts
    // maintains from the active language, unless a screen overrides it.
    return this.rtlEnabledInput ?? document?.documentElement?.dir === 'rtl';
  }

  protected get resolvedHeight(): number | string {
    if (this.height !== undefined && this.height !== null) return this.height;
    return this.isMobile ? gridMobileSettingDto.gridHeight : `${gridWebSettingDto.gridHeight}px`;
  }

  protected get resolvedPageSize(): number {
    return this.pageSize ?? (this.isMobile ? gridMobileSettingDto.pageSize : gridWebSettingDto.pageSize);
  }

  protected get resolvedAllowedPageSizes(): number[] {
    return (
      this.allowedPageSizes ??
      (this.isMobile ? gridMobileSettingDto.allowedPageSizes : gridWebSettingDto.allowedPageSizes)
    );
  }

  protected get resolvedPagerDisplayMode(): string {
    return this.isMobile ? gridMobileSettingDto.pagerDisplayMode : gridWebSettingDto.pagerDisplayMode;
  }

  protected get isMobile(): boolean {
    return this.responsive.isMobile();
  }

  protected get showMobileCards(): boolean {
    return this.enableMobileCards && !!this.mobileFields?.length;
  }

  // ---- Template helpers ----------------------------------------------------------
  captionOf(column: dataGridColumnDto): string {
    void this.langVersion; // dependency so bindings re-evaluate on language change
    const key = column.caption || column.dataField;
    return key ? this.translate.instant(key) : '';
  }

  noDataTextOf(): string {
    void this.langVersion;
    return this.translate.instant(this.noDataText);
  }

  searchPlaceholderOf(): string {
    void this.langVersion;
    return this.translate.instant(this.searchPlaceholder || 'COMMON.SEARCH');
  }

  loadingTextOf(): string {
    void this.langVersion;
    return this.translate.instant('COMMON.LOADING');
  }

  /** Maps config to one of the built-in templates (status badge / actions / boolean icon). */
  templateOf(column: dataGridColumnDto): string | undefined {
    if (column.cellTemplate) return column.cellTemplate;
    if (column.type === 'status') return 'sdgStatusTemplate';
    if (column.type === 'actions') return 'sdgActionsTemplate';
    if (column.type === 'check') return 'sdgCheckTemplate';
    return undefined;
  }

  /** Names of the screen-provided cellTemplates (rendered as generic dxTemplates). */
  get customTemplateNames(): string[] {
    return Object.keys(this.cellTemplates ?? {});
  }

  visibleActions(rowData: any): sharedGridRowActionDto[] {
    return this.rowActions.filter((action) => action.visible?.(rowData) ?? true);
  }

  actionDisabled(action: sharedGridRowActionDto, rowData: any): boolean {
    return action.disabled?.(rowData) ?? false;
  }

  labelOf(action: sharedGridRowActionDto): string {
    void this.langVersion;
    return action.labelKey ? this.translate.instant(action.labelKey) : action.id;
  }

  /** Inline-SVG markup for a row action's icon (replaces the mat-icon font glyph). */
  private iconMarkupCache = new Map<string, SafeHtml>();
  actionIconMarkup(icon: string | undefined): SafeHtml {
    const key = icon ?? '';
    let markup = this.iconMarkupCache.get(key);
    if (!markup) {
      markup = this.sanitizer.bypassSecurityTrustHtml(ROW_ACTION_ICON_PATHS[key] ?? ROW_ACTION_ICON_FALLBACK);
      this.iconMarkupCache.set(key, markup);
    }
    return markup;
  }

  doAction(action: sharedGridRowActionDto, rowData: any, event: Event): void {
    event.stopPropagation();
    this.rowAction.emit({ actionId: action.id, row: rowData });
  }

  /** Status-badge text: booleans map through trueText/falseText i18n keys. */
  statusText(cellInfo: any): string {
    void this.langVersion;
    const column = this.columnConfigFor(cellInfo);
    const value = cellInfo?.value ?? cellInfo?.data?.[cellInfo?.column?.dataField];
    if (typeof value === 'boolean') {
      const key = value ? column?.trueText || 'COMMON.ACTIVE' : column?.falseText || 'COMMON.INACTIVE';
      return this.translate.instant(key);
    }
    return value === undefined || value === null || value === '' ? '' : String(value);
  }

  statusClass(cellInfo: any): string {
    const column = this.columnConfigFor(cellInfo);
    const value = cellInfo?.value ?? cellInfo?.data?.[cellInfo?.column?.dataField];
    if (column?.statusClass) {
      return column.statusClass(cellInfo?.data, value);
    }
    return value ? 'success' : 'neutral';
  }

  private columnConfigFor(cellInfo: any): dataGridColumnDto | undefined {
    const field = cellInfo?.column?.dataField;
    return this.columns.find((c) => c.dataField === field);
  }

  // ---- Grid event bridges -----------------------------------------------------------
  protected onOptionChanged(e: any): void {
    if (!this.remoteOperations || !this.grid) return;
    const fullName: string = e.fullName || '';
    if (e.name === 'paging' || fullName.startsWith('paging')) {
      const instance = this.grid.instance;
      this.pageChange.emit({ pageIndex: instance.pageIndex(), pageSize: instance.pageSize() });
    } else if (e.name === 'sorting' || fullName === 'sorting') {
      const sorting = this.grid.instance.option('sorting') as any[] | undefined;
      const first = Array.isArray(sorting) ? sorting[0] : undefined;
      if (first?.selector) {
        this.sortChange.emit({
          field: String(first.selector),
          direction: first.desc ? 'desc' : 'asc',
        });
      } else {
        this.sortChange.emit({ field: '', direction: 'asc' });
      }
    }
  }

  protected onRowClick(e: any): void {
    this.rowClick.emit(e?.data);
  }

  protected onSelectionChanged(e: any): void {
    this.selectionChanged.emit(e?.selectedRowsData ?? []);
  }

  // ---- Public API (kept minimal; screens may need programmatic access) ---------------
  /** Refreshes the underlying DevExtreme instance (remote stores re-run load()). */
  refresh(): void {
    this.grid?.instance.refresh();
  }

  getInstance(): any {
    return this.grid?.instance;
  }
}



