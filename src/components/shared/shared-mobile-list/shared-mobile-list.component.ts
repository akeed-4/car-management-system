import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MobileHeaderComponent } from '../mobile-header/mobile-header.component';
import { ROW_ACTION_ICON_FALLBACK, ROW_ACTION_ICON_PATHS } from '../shared-data-grid/row-action-icons';
import {
  MobileListActionDto,
  MobileListActionEvent,
  MobileListFieldDto,
  MobileListFilterDto,
  MobileListFilterEvent,
} from './shared-mobile-list.model';

/**
 * Generic, application-wide mobile List/Index screen: title/header, search, a filter
 * panel, a card-per-row presentation (same .mobile-card-list-* classes the existing
 * MobileCardListComponent/SharedDataGrid mobile fallback use, from styles-mobile.css),
 * loading/empty states, load-more paging, and configurable row actions (view/edit/
 * delete/print/custom). Purely presentational -- it receives data/config through
 * @Input()s and reports user intent through @Output()s; the calling screen keeps
 * owning data loading, filtering, permissions and navigation, exactly like
 * SharedDataGridComponent does for desktop grids.
 *
 * A screen only needs this component when it wants MORE than SharedDataGridComponent's
 * built-in mobile-card fallback provides (its own header, a dedicated filter panel,
 * server-driven "load more" paging). Screens happy with SharedDataGridComponent's
 * automatic card swap should keep using that instead of duplicating it here.
 */
@Component({
  selector: 'shared-mobile-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MobileHeaderComponent,
  ],
  providers: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './shared-mobile-list.component.html',
  styleUrl: './shared-mobile-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedMobileListComponent<T = any> implements OnDestroy {
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private currencyPipe = inject(CurrencyPipe);
  private datePipe = inject(DatePipe);
  private decimalPipe = inject(DecimalPipe);

  /** Re-evaluated by template bindings so translated captions refresh on language change. */
  protected langVersion = 0;
  private langSub = this.translate.onLangChange.subscribe(() => {
    this.langVersion++;
    this.cdr.markForCheck();
  });

  // ---- Header ------------------------------------------------------------------
  @Input() title = '';
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();

  // ---- Data & configuration ------------------------------------------------------
  @Input({ required: true }) data: T[] = [];
  @Input({ required: true }) fields: MobileListFieldDto<T>[] = [];
  /** Reads a card's title (usually the primary/most identifying field). */
  @Input() titleOf: (item: T) => string = () => '';
  @Input() trackByFn: (index: number, item: T) => unknown = (index) => index;
  @Input() actions: MobileListActionDto<T>[] = [];
  @Input() loading = false;
  /** i18n key or literal shown when there is no data. */
  @Input() emptyMessage = 'COMMON.NO_DATA';

  // ---- Search ---------------------------------------------------------------------
  @Input() showSearch = true;
  @Input() searchValue = '';
  @Input() searchPlaceholder = 'COMMON.SEARCH';
  @Output() searchChange = new EventEmitter<string>();

  // ---- Filters --------------------------------------------------------------------
  @Input() filters: MobileListFilterDto[] = [];
  @Output() filterChange = new EventEmitter<MobileListFilterEvent>();
  protected filterPanelOpen = false;

  // ---- Paging / load more -----------------------------------------------------------
  /** Total row count on the server; omit to disable "load more" (all data is in `data`). */
  @Input() totalCount?: number;
  @Output() pageChange = new EventEmitter<void>();
  protected get canLoadMore(): boolean {
    return this.totalCount !== undefined && this.data.length < this.totalCount;
  }

  // ---- Outputs ----------------------------------------------------------------------
  @Output() action = new EventEmitter<MobileListActionEvent<T>>();
  @Output() itemClick = new EventEmitter<T>();

  /** Custom per-item card body, projected instead of the default fields[] rendering. */
  @ContentChild('itemTemplate') itemTemplate?: TemplateRef<{ $implicit: T }>;
  /** Custom header actions menu (mirrors MobileHeaderComponent's own content projection). */
  @ContentChild('headerActions') headerActionsTemplate?: TemplateRef<unknown>;

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }

  // ---- Template helpers ----------------------------------------------------------
  onSearchInput(value: string): void {
    this.searchValue = value;
    this.searchChange.emit(value);
  }

  toggleFilterPanel(): void {
    this.filterPanelOpen = !this.filterPanelOpen;
  }

  onFilterValueChange(key: string, value: any): void {
    const next: MobileListFilterEvent = {};
    for (const filter of this.filters) {
      next[filter.key] = filter.key === key ? value : filter.value;
    }
    this.filterChange.emit(next);
  }

  clearFilters(): void {
    const next: MobileListFilterEvent = {};
    for (const filter of this.filters) {
      next[filter.key] = filter.type === 'boolean' ? false : '';
    }
    this.filterChange.emit(next);
  }

  get hasActiveFilters(): boolean {
    return this.filters.some((f) => f.value !== undefined && f.value !== '' && f.value !== null && f.value !== false);
  }

  visibleFields(item: T): MobileListFieldDto<T>[] {
    return this.fields.filter((f) => f.visible?.(item) ?? true);
  }

  fieldValue(field: MobileListFieldDto<T>, item: T): string {
    const raw = field.value(item);
    if (raw === null || raw === undefined || raw === '') return '';
    switch (field.type) {
      case 'currency':
        return this.currencyPipe.transform(Number(raw), field.format || 'SAR', 'symbol', '1.2-2') ?? String(raw);
      case 'number':
        return this.decimalPipe.transform(Number(raw), field.format || '1.0-2') ?? String(raw);
      case 'date':
        return this.datePipe.transform(raw as any, field.format || 'yyyy-MM-dd') ?? String(raw);
      default:
        return String(raw);
    }
  }

  fieldStatusClass(field: MobileListFieldDto<T>, item: T): string {
    return field.statusClass?.(item) ?? 'neutral';
  }

  visibleActions(item: T): MobileListActionDto<T>[] {
    return this.actions.filter((a) => a.visible?.(item) ?? true);
  }

  actionDisabled(a: MobileListActionDto<T>, item: T): boolean {
    return a.disabled?.(item) ?? false;
  }

  labelOf(a: MobileListActionDto<T>): string {
    void this.langVersion;
    return a.labelKey ? this.translate.instant(a.labelKey) : a.id;
  }

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

  doAction(a: MobileListActionDto<T>, item: T, event: Event): void {
    event.stopPropagation();
    this.action.emit({ actionId: a.id, item });
  }

  onItemClick(item: T): void {
    this.itemClick.emit(item);
  }

  onLoadMore(): void {
    this.pageChange.emit();
  }

  onBack(): void {
    this.back.emit();
  }

  trackByField = (index: number, field: MobileListFieldDto<T>) => field.label;
  trackByAction = (index: number, a: MobileListActionDto<T>) => a.id;
  trackByFilter = (index: number, f: MobileListFilterDto) => f.key;
}
