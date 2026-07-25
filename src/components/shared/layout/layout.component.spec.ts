import { Subject } from 'rxjs';
import { LayoutComponent } from './layout.component';

// Direct instantiation (not TestBed.createComponent) -- LayoutComponent is a large, legacy-style
// component with many template-only dependencies (DevExtreme menus, OIDC, etc.) that aren't
// relevant to the logout flow; this scopes the test to that flow specifically rather than
// standing up the whole component's rendered surface. The constructor itself only touches
// languageService (read synchronously) and its own local searchSubject, so every other
// dependency can be a minimal stub.
describe('LayoutComponent logout flow', () => {
  let component: LayoutComponent;
  let authService: { currentUser: jest.Mock; logout: jest.Mock };
  let tenantContext: { clear: jest.Mock };
  let notificationService: { confirmAlert: jest.Mock; showSuccess: jest.Mock; showError: jest.Mock };
  let router: { navigate: jest.Mock };

  function createComponent(): LayoutComponent {
    const languageService: any = {
      getCurrentLanguage: () => 'en',
      language$: new Subject(),
    };
    authService = { currentUser: jest.fn(() => null), logout: jest.fn() };
    tenantContext = { clear: jest.fn() };
    notificationService = {
      confirmAlert: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
    };
    router = { navigate: jest.fn() };

    return new LayoutComponent(
      {} as any, // CurrentSettingService
      router as any, // Router
      {} as any, // HttpClient
      { instant: (key: string) => key } as any, // TranslateService
      {} as any, // CurrentUserService
      languageService, // LanguageService
      {} as any, // MenuService
      { menu$: new Subject() } as any, // DynamicMenuService
      {} as any, // OidcSecurityService
      document, // DOCUMENT
      {} as any, // Title
      {} as any, // MatDialog
      authService as any, // AuthService
      tenantContext as any, // TenantContextService
      notificationService as any, // NotificationService
    );
  }

  beforeEach(() => {
    component = createComponent();
  });

  describe('isAuthenticated', () => {
    it('reflects authService.currentUser()', () => {
      authService.currentUser.mockReturnValue(null);
      expect(component.isAuthenticated).toBe(false);

      authService.currentUser.mockReturnValue({ id: 1, name: 'Jane Doe', roleName: 'Admin', token: 't' });
      expect(component.isAuthenticated).toBe(true);
    });
  });

  describe('UserFullName', () => {
    it('reflects the current user\'s name, falling back to "User" when logged out', () => {
      authService.currentUser.mockReturnValue(null);
      expect(component.UserFullName).toBe('User');

      authService.currentUser.mockReturnValue({ id: 1, name: 'Jane Doe', roleName: 'Admin', token: 't' });
      expect(component.UserFullName).toBe('Jane Doe');
    });
  });

  describe('logOut', () => {
    it('shows a confirmation dialog before acting', async () => {
      notificationService.confirmAlert.mockResolvedValue({ isConfirmed: true });

      await component.logOut();

      expect(notificationService.confirmAlert).toHaveBeenCalledTimes(1);
    });

    it('cancelled confirmation does not call AuthService.logout or navigate', async () => {
      notificationService.confirmAlert.mockResolvedValue({ isConfirmed: false });

      await component.logOut();

      expect(authService.logout).not.toHaveBeenCalled();
      expect(tenantContext.clear).not.toHaveBeenCalled();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('confirmed logout calls AuthService.logout, clears tenant context, shows a success toast, and navigates to /login with replaceUrl', async () => {
      notificationService.confirmAlert.mockResolvedValue({ isConfirmed: true });

      await component.logOut();

      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(tenantContext.clear).toHaveBeenCalledTimes(1);
      expect(notificationService.showSuccess).toHaveBeenCalledWith('admin.logoutSuccess');
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { replaceUrl: true });
    });

    it('resets isLoggingOut after completing', async () => {
      notificationService.confirmAlert.mockResolvedValue({ isConfirmed: true });

      await component.logOut();

      expect(component.isLoggingOut).toBe(false);
    });

    it('ignores a second call while a logout is already in flight', async () => {
      let resolveConfirm!: (value: { isConfirmed: boolean }) => void;
      notificationService.confirmAlert.mockReturnValue(new Promise(resolve => { resolveConfirm = resolve; }));

      const first = component.logOut();
      component.isLoggingOut = true; // simulate the in-flight state the first call is about to set
      await component.logOut(); // should return immediately without a second confirmAlert call

      resolveConfirm({ isConfirmed: true });
      await first;

      expect(notificationService.confirmAlert).toHaveBeenCalledTimes(1);
    });
  });
});
