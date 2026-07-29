import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem } from '../../../../models/menu.model';

export interface SearchResult {
  label: string;
  parentLabel: string | null;
  route: string;
  icon?: string;
}

/** Command-palette-style search over the real, permission-filtered menu tree (DynamicMenuService).
 *  This is the one search surface with real data behind it today -- see ShellHeaderComponent's
 *  doc comment for why cross-entity search (invoices/customers/etc.) isn't included here. */
@Component({
  selector: 'app-global-search',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslateModule],
  templateUrl: './global-search.component.html',
  styleUrl: './global-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent implements OnChanges {
  @Input({ required: true }) menus: MenuItem[] = [];
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  query = signal('');
  activeIndex = signal(0);

  /** Root cause of the "empty until you type" bug: `menus` is a plain @Input(), not an Angular
   *  Signal input (this codebase predates the signal-input() API) -- so it does NOT flow into
   *  computed() reactively on its own, only ngOnChanges fires when the bound value changes.
   *  flatItems used to be set once here and never rebuilt, so it stayed [] forever regardless of
   *  what `menus` held; typing appeared to "start it working" only because results() re-evaluates
   *  on every query() change, re-running the (still-broken) filter -- it was never actually
   *  populated by that keystroke, it just looked that way in passing/informal testing. Fixed by
   *  ngOnChanges below, which rebuilds this from `menus` on every change including the very first
   *  one, so the index is correct the instant the dialog opens with no keystroke required. */
  flatItems = signal<SearchResult[]>([]);

  results = computed<SearchResult[]>(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return this.flatItems();
    return this.flatItems()
      .filter(r => r.label.toLowerCase().includes(term))
      .slice(0, 12);
  });

  constructor(private router: Router) {}

  /** Rebuilds the flattened search index whenever the `menus` @Input reference changes -- Angular
   *  calls ngOnChanges before ngOnInit for the initial binding too, so this covers both the very
   *  first render (dialog opens with a fully-populated index, no typing needed) and every later
   *  update (e.g. DynamicMenuService's BehaviorSubject pushing the real permission-filtered list
   *  after the initial empty [] it starts with, or a language switch re-labeling the tree). Keyed
   *  on 'menus' specifically so an `open`-only change (opening/closing the dialog) doesn't do
   *  redundant work. */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['menus']) {
      this.flatItems.set(this.flatten(this.menus));
    }
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const isMeta = event.metaKey || event.ctrlKey;
    if (isMeta && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.setOpen(!this.open);
    }
    if (event.key === 'Escape' && this.open) {
      this.setOpen(false);
    }
  }

  onQueryInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    if (!count) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update(i => (i + 1) % count);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update(i => (i - 1 + count) % count);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = this.results()[this.activeIndex()];
      if (target) this.select(target);
    }
  }

  select(result: SearchResult): void {
    this.router.navigate(['/' + result.route]);
    this.query.set('');
    this.setOpen(false);
  }

  setOpen(value: boolean): void {
    this.open = value;
    this.openChange.emit(value);
    if (!value) this.query.set('');
  }

  private flatten(items: MenuItem[], parentLabel: string | null = null): SearchResult[] {
    const result: SearchResult[] = [];
    for (const item of items) {
      if (item.route) {
        result.push({ label: item.name, parentLabel, route: item.route, icon: item.icon });
      }
      if (item.children?.length) {
        result.push(...this.flatten(item.children, item.name));
      }
    }
    return result;
  }
}
