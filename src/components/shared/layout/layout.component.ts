import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostListener, Inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { Theme } from 'devextreme/common/charts';
import { Subject, Subscription, filter, map, finalize, catchError, of, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Direction } from '@angular/cdk/bidi';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { environment } from '../../../environments/environment.development';
import { CurrentSettingService } from '../../../services/current-setting.service';
import { CurrentUserService } from '../../../services/current-user.service';
import { LanguageService } from '../../../services/language.service';
import { welcomeData } from '../../../types/welcomeData';
import { MenuService } from '../../../services/menu.service';
import { DxMenuModule, DxTreeListModule } from 'devextreme-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSelectModule,
    MatSidenavModule,
    MatToolbarModule,
    TranslateModule,
    RouterOutlet,
    DxMenuModule,
    DxTreeListModule
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
  @ViewChild('dxTreeList', { static: false }) dxTreeList!: any;

  menus: any[] = [];
  documents: any[] = [];
  @ViewChild('sidenav') sidenav!: MatSidenav;
  isExpanded = false;
  showSubmenu: boolean = false;
  isShowing = false;
  showSubSubMenu: boolean = false;
  year = new Date().getFullYear();
  isAuthenticated = false;
  userName = '';
  private identityUrl = environment.origin;
  currentLanguage!: string;
  userLanguage!: string;
  UserFullName: string = 'User';
  sideNavPosition!: string;
  menuRtlEnabled = false;
  menuName = "";
  styleMarginBody = "";
  showMe = false;

  textDir: Direction = this.languageService.getCurrentLanguage() == 'en' ? 'ltr' : 'rtl';
  manageText = 'manage';
  smallScreen = false;
  title = '';
  titleDetail = 'Detail';
  sideNavOpen = false;
  isMobile = true;
  rootName = environment.rootName;

  SUBMENU_HEIGHT = 200;
  limitSubmenuHeight = true;


  searchClicked = false;
  plainMenus: any[] = [];

  filteredOptions: any[] = []; // Options displayed in autocomplete
  private searchSubject = new Subject<string>();
  expandedKeys: number[] = []; // Store expanded row keys


  menuChanging: any;



  userRole = '';

  // Add constant for localStorage key
  private readonly LAST_SUBSCRIPTION_NOTIFICATION_KEY = 'last_subscription_notification_date';
  private readonly LAST_CONFIRMATION_NOTIFICATION_KEY = 'last_confirmation_notification_date';

  // Theme properties
  availableThemes: Theme[] = [];

  // System alert state
  systemAlertLoading = false;
  acknowledgingAlert = false;

  private alertFetchSubscription: Subscription | null = null;
  private readonly ALERT_SNOOZE_DURATION_MS = 15 * 60 * 1000;
  private dismissedAlertTimestamps = new Map<number, number>();
  private lastMarkedAlertId: number | null = null;
  private alertCompanyId: number | null = null;
  private systemAlertInitializedForCompanyId: number | null = null;
  private userId: string | null = null;
  private activeAlertManuallyCleared = false;

  // User notification banner for email/phone confirmation
  userNotification: { message: string; actionText?: string; type?: 'info' | 'warning' | 'error' } | null = null;
  private emailConfirmed: boolean = true;
  private phoneNumberConfirmed: boolean = true;
  systemAdminUrl: any;;

  constructor(
    private currentSettingService: CurrentSettingService,
    private router: Router,
    public http: HttpClient,
      private translateService: TranslateService,
    private currentUserService: CurrentUserService,
    private languageService: LanguageService,
    private menuService: MenuService,
    public oidcSecurityService: OidcSecurityService,
    @Inject(DOCUMENT) private document: Document,
    private titleService: Title,
    public dialog: MatDialog,
  ) {
    this.itemClick = this.itemClick.bind(this);
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.setupSearchListener();
    // Subscribe to language changes to update direction and menu settings dynamically
    this.languageService.language$.subscribe(lang => {
      this.currentLanguage = lang;
      this.textDir = lang === 'en' ? 'ltr' : 'rtl';
      this.changeDirection();
      this.changeMenuSettings();
      this.handleToggle();
      this.changeStyleMarginBody();
    });
  }

  ngOnInit() {
    this.changeOnScreenSize();
    this.handleToggle();
    this.scrollBack();
    this.getTitle();
    this.getMenuChanging();
    this.currentSettingService.setFormToBeClean();
    this.changeMenuSettings();
    this.loadMenus(); // Add this to load menus from service
    // Comment out OIDC for now to avoid injection error
    // this.oidcSecurityService
    //   .checkAuth()
    //   .subscribe((loginResponse: LoginResponse) => {
    //     const { isAuthenticated, userData, accessToken, idToken, configId } =
    //       loginResponse;
    //     if (!isAuthenticated) {
    //       // this.showMe = true;
    //       // this.oidcSecurityService.authorize();
    //       // this.router.navigate([`/unauthorized`]);
    //     } else {
    //       debugger;
    //       if (this.isMobile) {
    //         setTimeout(() => {
    //           this.isExpanded = false;
    //           this.onToggleClick();
    //         }, 2000);
    //       }
    //       // if(this.localStorageService.getLocalStorage(staticData.lastUrl) != ''){
    //       //   // var url = this.localStorageService.getLocalStorage(staticData.lastUrl);
    //       //   var currentUrl = this.router.url;
    //       //   if(currentUrl == '/'){
    //       //     this.router.navigate([`/home`]);
    //       //     //this.router.navigate([`${url}`]);
    //       //   }
    //       // }
    //     }
    //   });
  }

  loadMenus() {
    this.menuService.getMenus().subscribe({
      next: (menus) => {
        this.menus = menus;
        console.log('Menus loaded:', this.menus);
      },
      error: (err) => {
        console.error('Failed to load menus', err);
        // Optionally, fall back to hardcoded menus
        // this.menus = this.menuService.menuData;
      }
    });
  }





  getMenuChanging() {
    this.menuChanging = this.currentSettingService.menuChanged$.subscribe(params => {
      if (params) {
        this.menuChanging = params;
        // Reload or update your side menu based on new parameters
      }
    });
  }

  getTitle() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const child = this.router.routerState.root.firstChild;
        if (child && child.snapshot.data['title']) {
          return child.snapshot.data['title'];
        }
        return this.currentSettingService.getApplicationName();
      })
    ).subscribe((title: string) => {
      this.titleService.setTitle(title);
    });
  }

  ngAfterViewInit() {
    if (this.isMobile) {
      setTimeout(() => {
        this.isExpanded = false;
        this.onToggleClick();
      }, 3000);
    }
  }

  ngOnDestroy(): void {
    this.alertFetchSubscription?.unsubscribe();

    if (this.menuChanging && typeof this.menuChanging.unsubscribe === 'function') {
      this.menuChanging.unsubscribe();
    }
  }

  // ===== System alert handling =====








  logIn() {
    // this.oidcSecurityService.authorize();
    console.log('Login clicked');
  }
  // help() {
  //   var url = `${environment.rootName}/help/chat`;
  //   this.router.navigate([url]);
  // }

  logOut() {
    // this.oidcSecurityService
    //   .logoff()
    //   .subscribe((result) => console.log(result));
    console.log('Logout clicked');
  }

  changePassword() {
    window.location.href = this.identityUrl + '/Manage/ChangePassword';
  }

  goToSystemAdmin() {
    //var from = environment.clientId;
    //window.open(this.systemAdminUrl + '/management/home?from=' + from, '_blank');
    window.open(this.systemAdminUrl + '/management/home', '_blank');
  }

  goToUserProfile() {
    //var from = environment.clientId;
    //window.open(this.systemAdminUrl + '/management/profile?from=' + from, '_blank');
    window.open(this.systemAdminUrl + '/management/profile', '_blank');
  }

  onChangeLanguage(language: string) {
    this.changeLocalLanguage(language);
    this.changeDirection();
    this.changeMenuSettings();
    // this.getUserData();
    // this.changeDbLanguage(this.userName,language);
  }

  changeLocalLanguage(language: string) {
    this.languageService.changeLocalLanguage(language);
    this.currentLanguage = language;
  }

  setLocalLanguage(language: string) {
    this.languageService.changeLocalLanguage(language);
    this.currentLanguage = language;
  }
  changeDbLanguage(userName: string, languageCode: string) {
    this.currentUserService.ChangeUserLanguage(languageCode).subscribe(
      result => {
        if (result == true) {
          this.changeLocalLanguage(languageCode);
        }
      },
      error => {
      }
    );
  }

  changeDirection() {
    const htmlTag = this.document.getElementsByTagName('html')[0] as HTMLHtmlElement;
    htmlTag.dir = this.currentLanguage === 'ar' ? 'rtl' : 'ltr';
    htmlTag.lang = this.currentLanguage;
    // Force update of DevExtreme menu direction
      // Change sidenav position

  }

  changeStyleMarginBody() {
    this.styleMarginBody = this.currentLanguage == 'en' ? 'margin-left: 115px;' : 'margin-right: 115px;';
  }
  changeMenuSettings() {
    this.menuRtlEnabled = this.currentLanguage == 'en' ? false : true;
    this.menuName = this.currentLanguage == 'en' ? "menuNameEn" : "menuNameAr";
  }

  itemClick(data: any) {
    const item = data.itemData;
    if (item.route != null) {
      this.router.navigate([item.route]);
      this.isExpanded = false;
      this.onToggleClick();
    }
  }


  scrollBack() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
  }

  onToggleClick() {
    // Keep `sideNavOpen` consistent with `isExpanded` (template toggles isExpanded).
    this.sideNavOpen = this.isExpanded;
    this.handleToggle();
  }

  handleToggle() {
    if (this.isExpanded && !this.isMobile) {
      this.styleMarginBody = this.currentLanguage == 'en' ? 'margin-left: 115px;' : 'margin-right: 115px;';
    } else {
      this.styleMarginBody = this.currentLanguage == 'en' ? 'margin-left: 1px;' : 'margin-right: 1px;';
    }
  }

  mouseenter() {
    if (!this.isExpanded) {
      this.isShowing = true;
    }
  }

  mouseleave() {
    if (!this.isExpanded) {
      this.isShowing = false;
    }
  }

  getManageText() {
    this.currentSettingService.usingSmallScreen().subscribe(result => {
      if (result) {
        debugger;
        this.smallScreen = result;
        var firstName = null;
        try {
          firstName = this.UserFullName?.split(' ')[0] || null;
          if (firstName != null && firstName.length < 4) {
            firstName = this.UserFullName?.split(' ')[0] + ' ' + this.UserFullName?.split(' ')[1] || null;
          } else {
            firstName = this.UserFullName?.split(' ')[0] || null;
          }
        } catch (error) {
          firstName = null;
        }

        this.manageText = firstName != null ? (this.languageService.getCurrentLanguage() == 'en' ? welcomeData.welcomeEn : welcomeData.welcomeAr) + ' ' + firstName : (this.languageService.getCurrentLanguage() == 'en' ? welcomeData.manageEn : welcomeData.manageAr);
      } else {
        this.smallScreen = result;
        this.manageText = (this.languageService.getCurrentLanguage() == 'en' ? welcomeData.welcomeEn : welcomeData.welcomeAr) + ' ' + this.UserFullName;
      }
    })
  }


  onSubmenuShowing(submenuContainer: any) {
    submenuContainer.element.style.maxHeight = '60vh';
    // No AI buttons in submenus - only in main menu
  }

  changeOnScreenSize() {
    this.currentSettingService.usingSmallScreen().subscribe((result) => {
      this.isMobile = result;
    })
  }

  toggleTooltip(tooltip: any) {
    tooltip._isTooltipVisible() ? tooltip.hide() : tooltip.show();
    this.showMenWhereIAm();
  }

  showMenWhereIAm() {
    var companyName = this.currentSettingService.getCompanyName()
    var branchName = this.currentSettingService.getBranchName()
    var storeName = this.currentSettingService.getStoreName()
    var message = this.translateService.instant('userSetting.yourLocation', { companyName: companyName, branchName: branchName, storeName: storeName });


  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (this.currentSettingService.isFormDirty()) {
      $event.returnValue = false;
    }
  }


  openSearch() {
    this.document.getElementById('myOverlay')!.style.display = "block";
    this.document.getElementById('mySearch')!.focus();
    this.searchClicked = true;
  }

  closeSearch() {
    this.document.getElementById('myOverlay')!.style.display = "none";
    this.searchClicked = false;
  }

  onSearch(e: any) {
    this.searchSubject.next(e.target.value);
  }

  private setupSearchListener(): void {
    this.searchSubject
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
      ).subscribe((results: any) => {
        this.filteredOptions = results;
      });
  }

  onSearchOptionSelected(e: any) {
    debugger;
    var url = `${environment.rootName}/${e.option.value.route}`;
    this.router.navigate([url]);
    this.closeSearch();
    (this.document.getElementById('mySearch') as HTMLInputElement).value = '';
    this.searchSubject.next('');
  }



  chooseBusinessAgain() {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      var url = `${environment.rootName}/home`;
      this.router.navigate([url]);
    });
  }

  openSearchComponent() {
    var currentUrl = this.router.url;
    var homeUrl = `/${environment.rootName}/home`;
    if (currentUrl != homeUrl) {
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        var url = `${environment.rootName}/menu`;
        this.router.navigate([url]);
      });
    }
  }
  onRowClick(e: any): void {
    debugger
    const isCurrentlyExpanded = this.dxTreeList.instance.isRowExpanded(e.key);

    if (e.event.target.tagName.toLowerCase() != "span") {
      if (isCurrentlyExpanded) {
        this.dxTreeList.instance.collapseRow(e.key);
      } else {
        this.dxTreeList.instance.expandRow(e.key);
      }
    }
    this.onMenuClick(e);
  }

  onMenuClick(e: any) {
    if (e.data.menuUrl != null) {
      var url = `${environment.rootName}/${e.data.menuUrl}`;
      this.router.navigate([url]);
      this.isExpanded = false;
      this.onToggleClick();
    }
  }

  isHomeRoute(): boolean {
    var currentUrl = this.router.url;
    var homeUrl = `/${environment.rootName}/home`;
    return currentUrl == homeUrl;
  }
 

  // Check if subscription notification was shown today
  private wasNotificationShownToday(): boolean {
    const lastNotificationDateStr = localStorage.getItem(this.LAST_SUBSCRIPTION_NOTIFICATION_KEY);
    if (!lastNotificationDateStr) {
      return false;
    }

    const lastDate = new Date(lastNotificationDateStr);
    const today = new Date();

    return lastDate.getDate() === today.getDate() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getFullYear() === today.getFullYear();
  }

  // Save current date as last notification date
  private saveLastNotificationDate(): void {
    localStorage.setItem(this.LAST_SUBSCRIPTION_NOTIFICATION_KEY, new Date().toString());
  }

  /**
   * Handle notification action click - navigate to user profile
   */
  onNotificationAction(): void {
    this.goToUserProfile();
  }

  /**
   * Handle notification dismiss
   */
  onNotificationDismiss(): void {
    this.saveLastConfirmationNotificationDate();
    this.userNotification = null;
  }

  // Check if confirmation notification was shown today
  private wasConfirmationNotificationShownToday(): boolean {
    const lastNotificationDateStr = localStorage.getItem(this.LAST_CONFIRMATION_NOTIFICATION_KEY);
    if (!lastNotificationDateStr) {
      return false;
    }

    const lastDate = new Date(lastNotificationDateStr);
    const today = new Date();

    return lastDate.getDate() === today.getDate() &&
      lastDate.getMonth() === today.getMonth() &&
      lastDate.getFullYear() === today.getFullYear();
  }

  // Save current date as last confirmation notification date
  private saveLastConfirmationNotificationDate(): void {
    localStorage.setItem(this.LAST_CONFIRMATION_NOTIFICATION_KEY, new Date().toString());
  }


}
