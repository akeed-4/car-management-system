import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicMenuService } from '../../../../services/dynamic-menu.service';
import { MenuItem } from '../../../../models/menu.model';

interface Crumb {
  label: string;
  route: string | null;
}

/** Derives breadcrumbs from the current route matched against DynamicMenuService's menu tree
 *  (via findMenuByRoute + its parent chain), rather than route `data.title`, since no route in
 *  app.routes.ts actually sets that today -- this uses data that's genuinely populated instead. */
@Component({
  selector: 'app-shell-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslateModule],
  templateUrl: './shell-breadcrumb.component.html',
  styleUrl: './shell-breadcrumb.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellBreadcrumbComponent implements OnInit, OnDestroy {
  crumbs = signal<Crumb[]>([]);
  private routerSub?: Subscription;
  private menuSub?: Subscription;

  constructor(private router: Router, private dynamicMenuService: DynamicMenuService) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.rebuild());

    // Menu tree may still be loading on first paint -- rebuild once it arrives too.
    this.menuSub = this.dynamicMenuService.menu$.subscribe(() => this.rebuild());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.menuSub?.unsubscribe();
  }

  private rebuild(): void {
    const currentPath = this.router.url.split('?')[0].replace(/^\//, '');
    const menus = this.dynamicMenuService.getCurrentMenus();
    const chain = this.findChain(menus, currentPath);
    this.crumbs.set(chain.map((item, index) => ({
      label: item.name,
      route: index === chain.length - 1 ? null : (item.route ?? null),
    })));
  }

  private findChain(items: MenuItem[], targetRoute: string, trail: MenuItem[] = []): MenuItem[] {
    for (const item of items) {
      const nextTrail = [...trail, item];
      if (item.route === targetRoute) return nextTrail;
      if (item.children?.length) {
        const found = this.findChain(item.children, targetRoute, nextTrail);
        if (found.length) return found;
      }
    }
    return [];
  }
}
