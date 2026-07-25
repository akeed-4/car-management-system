import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, isObservable, firstValueFrom } from 'rxjs';
import { companySelectedGuard } from './company-selected.guard';
import { AuthService } from '../services/AuthService.service';
import { TenantContextService } from '../services/tenant-context.service';
import { NotificationService } from '../services/notification.service';
import { TenantMembershipDto } from '../models/platform/tenant-membership.model';
import { TenantStatus } from '../models/enums/platform.enums';

describe('companySelectedGuard', () => {
  let httpMock: HttpTestingController;
  let router: Router;
  let notificationService: NotificationService;

  const membership = (tenantId: number): TenantMembershipDto => ({
    tenantId,
    tenantCode: `code-${tenantId}`,
    tenantName: `Tenant ${tenantId}`,
    tenantStatus: TenantStatus.Active,
    role: 'Owner',
    isCurrent: false,
  });

  function runGuard() {
    const route: any = {};
    const state: any = { url: '/dashboard' };
    return TestBed.runInInjectionContext(() => companySelectedGuard(route, state));
  }

  async function resolve(result: ReturnType<typeof runGuard>): Promise<boolean | UrlTree> {
    return isObservable(result) ? firstValueFrom(result) : (result as boolean | UrlTree);
  }

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    TestBed.overrideProvider(NotificationService, {
      useValue: { showError: jest.fn(), showSuccess: jest.fn(), showWarning: jest.fn() },
    });

    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    notificationService = TestBed.inject(NotificationService);

    const authService = TestBed.inject(AuthService);
    jest.spyOn(authService, 'isLoggedIn').mockReturnValue(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('auto-selects a single tenant and allows activation', async () => {
    const resultPromise = resolve(runGuard());

    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants')).flush([membership(1)]);
    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/1/select')).flush({
      id: 1, name: 'u', roleName: 'Owner', token: 't', tenantId: 1, tenantName: 'Tenant 1', tenantCode: 'code-1',
    });

    expect(await resultPromise).toBe(true);
    expect(TestBed.inject(TenantContextService).current()?.tenantId).toBe(1);
  });

  it('redirects to /select-company when the caller has multiple tenants', async () => {
    const resultPromise = resolve(runGuard());

    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants')).flush([membership(1), membership(2)]);

    const result = await resultPromise;
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toContain('/select-company');
  });

  it('on a definitive 403 from selectTenant, clears tenant context, shows an error, and redirects to /login', async () => {
    const resultPromise = resolve(runGuard());

    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants')).flush([membership(1)]);
    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/1/select'))
      .flush({ message: 'forbidden' }, { status: 403, statusText: 'Forbidden' });

    const result = await resultPromise;
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toContain('/login');
    expect(notificationService.showError).toHaveBeenCalledWith('PLATFORM.TENANT_NOT_FOUND');
    expect(TestBed.inject(TenantContextService).current()).toBeNull();
  });

  it('fails open (allows activation) on a transient network/server error', async () => {
    const resultPromise = resolve(runGuard());

    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants')).flush([membership(1)]);
    httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/1/select'))
      .flush('server error', { status: 500, statusText: 'Internal Server Error' });

    expect(await resultPromise).toBe(true);
    expect(notificationService.showError).not.toHaveBeenCalled();
  });
});
