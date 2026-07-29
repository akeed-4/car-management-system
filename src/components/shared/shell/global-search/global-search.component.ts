import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, computed, signal } from '@angular/core';
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
export class GlobalSearchComponent {
  @Input({ required: true }) menus: MenuItem[] = [];
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  query = signal('');
  activeIndex = signal(0);

  private flatItems = computed<SearchResult[]>(() => this.flatten(this.menus));

  results = computed<SearchResult[]>(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) return [];
    return this.flatItems()
      .filter(r => r.label.toLowerCase().includes(term))
      .slice(0, 12);
  });

  constructor(private router: Router) {}

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
