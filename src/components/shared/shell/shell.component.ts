import { ChangeDetectionStrategy, Component, Inject, NgZone, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { AuthService } from '../../../services/AuthService.service';
import { TenantContextService } from '../../../services/tenant-context.service';
// Toast/confirm-dialog wrapper. Distinct from NotificationFeedService below, which is the
// persisted notification feed behind the bell -- both are used here.
import { NotificationService } from '../../../services/notification.service';
import { NotificationFeedService } from '../../../services/notification-feed.service';
import { LanguageService } from '../../../services/language.service';
import { ThemeService, AppTheme } from '../../../services/theme.service';
import { ResponsiveService } from '../../../services/responsive.service';
import { DynamicMenuService } from '../../../services/dynamic-menu.service';
import { MenuService } from '../../../services/menu.service';
import { MenuItem } from '../../../models/menu.model';
import { ChangePasswordDialogComponent } from '../../users/change-password-dialog/change-password-dialog.component';

import { ShellHeaderComponent } from './header/shell-header.component';
import { ShellNavRailComponent } from './nav-rail/shell-nav-rail.component';
import { ShellBreadcrumbComponent } from './workspace/shell-breadcrumb.component';
import { NotificationCenterComponent } from './notification-center/notification-center.component';
import { GlobalSearchComponent } from './global-search/global-search.component';

const RAIL_COLLAPSED_STORAGE_KEY = 'shell_rail_collapsed';

/**
 * Enterprise shell v2 -- replaces LayoutComponent as the routed shell (see app.routes.ts). Every
 * piece of business logic below is a direct port of what LayoutComponent already did (menu
 * loading/hybrid fallback, language/RTL, logout flow, mobile detection); only the DOM/visual
 * layer is new. Child components (header/rail/breadcrumb/search/notifications) are presentational
 * or self-contained -- this component is the one place that talks to the real services.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    TranslateModule,
    ShellHeaderComponent,
    ShellNavRailComponent,
    ShellBreadcrumbComponent,
    NotificationCenterComponent,
    GlobalSearchComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent implements OnInit, OnDestroy {
  menus: MenuItem[] = [];
  currentLanguage = this.languageService.getCurrentLanguage();
  currentTheme: AppTheme = this.themeService.getCurrentTheme();
  isLoggingOut = false;
  searchOpen = signal(false);
  notificationsOpen = signal(false);
  railCollapsed = signal(this.readStoredCollapsed());
  year = new Date().getFullYear();

  isMobile = this.responsiveService.isMobile;

  /** Drives the header bell badge. */
  unreadNotifications = this.notificationFeed.unreadCount;

  /** Bound listener so it can be detached in ngOnDestroy. */
  private readonly onServiceWorkerMessage = (event: MessageEvent): void => {
    // Sent by notification-sw.js when a push notification is clicked and an app tab already
    // exists: route in-place rather than letting the worker openWindow() and reload the SPA.
    if (event.data?.type !== 'NOTIFICATION_CLICK') return;

    this.zone.run(() => {
      if (event.data.url) {
        this.router.navigateByUrl(event.data.url);
      }
      if (event.data.notificationId) {
        this.notificationFeed
          .markAsRead(event.data.notificationId)
          .subscribe({ error: () => undefined });
      }
    });
  };

  get isAuthenticated(): boolean {
    return !!this.authService.currentUser();
  }

  get userFullName(): string {
    return this.authService.currentUser()?.name || 'User';
  }

  get userAvatarUrl(): string | null {
    return this.authService.currentUser()?.avatarUrl ?? null;
  }

  get isPlatformAdmin(): boolean {
    return !!this.authService.currentUser()?.isPlatformAdmin;
  }

  constructor(
    private router: Router,
    private authService: AuthService,
    private tenantContext: TenantContextService,
    private notificationService: NotificationService,
    private notificationFeed: NotificationFeedService,
    private zone: NgZone,
    private languageService: LanguageService,
    private themeService: ThemeService,
    private responsiveService: ResponsiveService,
    private dynamicMenuService: DynamicMenuService,
    private menuService: MenuService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
      this.applyDirection(lang);
      this.updateMenusForLanguage();
    });
    this.themeService.theme$.subscribe(theme => {
      this.currentTheme = theme;
      this.applyTheme();
    });
  }

  ngOnInit(): void {
    this.loadMenus();
    this.initNotifications();
    // Auto-collapse the rail on route changes on mobile, mirroring LayoutComponent.scrollBack()'s
    // auto-close-drawer-on-navigate behavior for the old mode="over" sidenav.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      window.scrollTo(0, 0);
      if (this.isMobile() && !this.railCollapsed()) {
        this.setRailCollapsed(true);
      }
    });
  }

  ngOnDestroy(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', this.onServiceWorkerMessage);
    }
    void this.notificationFeed.stopRealtime();
  }

  /**
   * Brings up the notification feed for a signed-in user: badge count, live SignalR stream, and
   * (best-effort) Web Push registration. Every part degrades independently -- a failed socket or a
   * denied push prompt still leaves the bell working off the REST feed.
   */
  private initNotifications(): void {
    if (!this.isAuthenticated) return;

    this.notificationFeed.refreshUnreadCount().subscribe({ error: () => undefined });
    void this.notificationFeed.startRealtime();

    // Deliberately not awaited: push setup shows a permission prompt and must never delay the
    // shell rendering.
    void this.notificationFeed.registerPush();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.onServiceWorkerMessage);
    }
  }

  private loadMenus(): void {
    this.dynamicMenuService.menu$.subscribe({
      next: menus => { this.menus = menus; },
    });
    this.dynamicMenuService.loadMenus().subscribe({
      error: () => {
        this.menuService.getMenus().subscribe({
          next: staticMenus => { this.menus = this.transformStaticMenus(staticMenus); },
        });
      },
    });
  }

  private updateMenusForLanguage(): void {
    const current = this.dynamicMenuService.getCurrentMenus();
    if (current?.length) {
      this.menus = current;
    } else {
      this.menuService.getMenus().subscribe({
        next: staticMenus => { this.menus = this.transformStaticMenus(staticMenus); },
      });
    }
  }

  private transformStaticMenus(menus: any[]): MenuItem[] {
    const useEnglish = this.currentLanguage === 'en';
    return menus.map(menu => ({
      ...menu,
      name: useEnglish ? menu.englishName : menu.name,
      children: menu.submenu?.map((sub: any) => ({ ...sub, name: useEnglish ? sub.englishName : sub.name })),
    }));
  }

  toggleRail(): void {
    this.setRailCollapsed(!this.railCollapsed());
  }

  private setRailCollapsed(value: boolean): void {
    this.railCollapsed.set(value);
    localStorage.setItem(RAIL_COLLAPSED_STORAGE_KEY, String(value));
  }

  private readStoredCollapsed(): boolean {
    return localStorage.getItem(RAIL_COLLAPSED_STORAGE_KEY) === 'true';
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
  }

  onThemeToggle(): void {
    this.themeService.toggleTheme();
  }

  onChangeLanguage(language: string): void {
    this.languageService.changeLocalLanguage(language);
  }

  private applyDirection(lang: string): void {
    const htmlTag = this.document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    htmlTag.dir = lang === 'ar' ? 'rtl' : 'ltr';
    htmlTag.lang = lang;
  }

  /** Only stamps [data-theme] once the user has made an explicit choice -- otherwise leaves the
   *  attribute unset so styles.css's prefers-color-scheme media query governs the first render. */
  private applyTheme(): void {
    const htmlTag = this.document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    if (this.themeService.getStoredTheme()) {
      htmlTag.setAttribute('data-theme', this.currentTheme);
    } else {
      htmlTag.removeAttribute('data-theme');
    }
  }

  logIn(): void {
    this.router.navigate(['/login']);
  }

  async logOut(): Promise<void> {
    if (this.isLoggingOut) return;
    const result = await this.notificationService.confirmAlert(
      this.translateService.instant('admin.confirmLogoutTitle'),
      this.translateService.instant('admin.confirmLogoutText'),
      this.translateService.instant('admin.logout'),
    );
    if (!result.isConfirmed) return;

    this.isLoggingOut = true;
    try {
      // Torn down before the token is cleared: the socket and the push endpoint both belong to
      // the outgoing user, and leaving either alive would deliver their notifications to whoever
      // signs in next on this browser.
      await this.notificationFeed.stopRealtime();
      await this.notificationFeed.unregisterPush();

      this.authService.logout();
      this.tenantContext.clear();
      this.notificationService.showSuccess('admin.logoutSuccess');
    } catch {
      this.notificationService.showError('admin.logoutError');
    } finally {
      this.isLoggingOut = false;
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, { width: '440px' });
  }

  goToSystemAdmin(): void {
    this.router.navigate(['/platform/dashboard']);
  }

  goToUserProfile(): void {
    this.router.navigate(['/profile']);
  }
}
