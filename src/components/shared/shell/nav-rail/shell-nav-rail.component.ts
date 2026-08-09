import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem } from '../../../../models/menu.model';
import { ResponsiveService } from '../../../../services/responsive.service';
import { NavRailItemComponent } from './nav-rail-item.component';

const PINNED_STORAGE_KEY = 'shell_pinned_routes';
const RECENT_STORAGE_KEY = 'shell_recent_routes';
const RECENT_MAX = 6;

/** Standalone, self-contained nav rail: takes the already permission-filtered MenuItem[] from
 *  DynamicMenuService (via ShellComponent) and renders it as a collapsible rail with an in-rail
 *  filter, pinned items, and recently-visited items. Pin/recent state is purely a client-side
 *  convenience (localStorage) -- no backend concept of "favorites" exists today, so nothing here
 *  claims otherwise. */
@Component({
  selector: 'app-shell-nav-rail',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, TranslateModule, NavRailItemComponent],
  templateUrl: './shell-nav-rail.component.html',
  styleUrl: './shell-nav-rail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellNavRailComponent {
  // Signal input, not a plain @Input(): filteredMenus/flatItems below are computed()s, which only
  // re-run when a tracked *signal* read changes. A plain @Input property read inside a computed()
  // is invisible to its dependency tracking, so the computed would keep returning its first
  // (empty) memoized result forever, until some unrelated signal (e.g. filterQuery) happened to
  // change and force a recompute -- exactly the "menu stays empty until you interact with
  // something" bug already diagnosed and fixed the same way in GlobalSearchComponent.
  menus = input.required<MenuItem[]>();
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() itemActivated = new EventEmitter<MenuItem>();

  private responsive = inject(ResponsiveService);
  /** Drives the off-canvas drawer + backdrop on phones/tablet-portrait. */
  isMobile = this.responsive.isMobile;

  filterQuery = signal('');

  pinnedRoutes = signal<string[]>(this.readStoredRoutes(PINNED_STORAGE_KEY));
  recentRoutes = signal<string[]>(this.readStoredRoutes(RECENT_STORAGE_KEY));

  private flatItems = computed(() => this.flatten(this.menus()));

  filteredMenus = computed<MenuItem[]>(() => {
    const term = this.filterQuery().trim().toLowerCase();
    if (!term) return this.menus();
    return this.filterTree(this.menus(), term);
  });

  pinnedItems = computed<MenuItem[]>(() => {
    const routes = new Set(this.pinnedRoutes());
    return this.flatItems().filter(item => item.route && routes.has(item.route));
  });

  recentItems = computed<MenuItem[]>(() => {
    const order = this.recentRoutes();
    const byRoute = new Map(this.flatItems().filter(i => i.route).map(i => [i.route as string, i]));
    return order.map(route => byRoute.get(route)).filter((i): i is MenuItem => !!i);
  });

  toggleCollapsed(): void {
    this.collapsedChange.emit(!this.collapsed);
  }

  closeDrawer(): void {
    this.collapsedChange.emit(true);
  }

  onItemActivated(item: MenuItem): void {
    if (item.route) this.trackRecent(item.route);
    this.itemActivated.emit(item);
  }

  isPinned(item: MenuItem): boolean {
    return !!item.route && this.pinnedRoutes().includes(item.route);
  }

  togglePin(item: MenuItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!item.route) return;
    const route = item.route;
    const next = this.isPinned(item)
      ? this.pinnedRoutes().filter(r => r !== route)
      : [...this.pinnedRoutes(), route];
    this.pinnedRoutes.set(next);
    localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(next));
  }

  private trackRecent(route: string): void {
    const next = [route, ...this.recentRoutes().filter(r => r !== route)].slice(0, RECENT_MAX);
    this.recentRoutes.set(next);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  }

  private readStoredRoutes(key: string): string[] {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private flatten(items: MenuItem[]): MenuItem[] {
    const result: MenuItem[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children?.length) result.push(...this.flatten(item.children));
    }
    return result;
  }

  /** Keeps a parent visible if it or any descendant matches, so filtering doesn't hide the whole
   *  branch just because the match is a few levels deep. */
  private filterTree(items: MenuItem[], term: string): MenuItem[] {
    const result: MenuItem[] = [];
    for (const item of items) {
      const selfMatches = item.name?.toLowerCase().includes(term);
      const filteredChildren = item.children?.length ? this.filterTree(item.children, term) : [];
      if (selfMatches || filteredChildren.length) {
        result.push({ ...item, children: filteredChildren.length ? filteredChildren : item.children });
      }
    }
    return result;
  }
}
