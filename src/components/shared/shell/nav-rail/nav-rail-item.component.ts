import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem } from '../../../../models/menu.model';

/** Recursive renderer for one MenuItem (and its children) inside the nav rail. Self-referencing
 *  via its own selector in the template so depth isn't hardcoded -- the real menu tree
 *  (DynamicMenuService) can be arbitrarily nested. */
@Component({
  selector: 'app-nav-rail-item',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, TranslateModule, NavRailItemComponent],
  templateUrl: './nav-rail-item.component.html',
  styleUrl: './nav-rail-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavRailItemComponent {
  @Input({ required: true }) item!: MenuItem;
  /** Collapsed rail shows icon-only; children/labels/badges hide. */
  @Input() collapsed = false;
  @Input() depth = 0;
  @Output() itemActivated = new EventEmitter<MenuItem>();

  expanded = signal(false);

  hasChildren = computed(() => (this.item.children?.length ?? 0) > 0);

  /** Menu sources disagree on whether `route` already has a leading slash (the live
   *  DynamicMenuService tree doesn't -- see ShellBreadcrumbComponent, which strips router.url's
   *  own leading slash before comparing against item.route -- but the static MenuService
   *  fallback's hardcoded data always includes one). Normalizing here means a routerLink is
   *  correct either way instead of only for whichever convention happens to be live. */
  resolvedRoute = computed<string[] | null>(() => {
    const route = this.item.route;
    if (!route) return null;
    return ['/' + route.replace(/^\/+/, '')];
  });

  toggleExpanded(event: Event): void {
    if (!this.hasChildren()) return;
    event.preventDefault();
    event.stopPropagation();
    this.expanded.update(v => !v);
  }

  onLeafClick(): void {
    this.itemActivated.emit(this.item);
  }
}
