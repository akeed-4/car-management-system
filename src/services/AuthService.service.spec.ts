import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, AppLoginResponse } from './AuthService.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const sampleResponse: AppLoginResponse = {
    id: 1,
    name: 'Jane Doe',
    roleName: 'Admin',
    token: 'access-token-1',
    refreshToken: 'refresh-token-1',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('setSession', () => {
    it('updates the currentUser signal', () => {
      expect(service.currentUser()).toBeNull();

      service.setSession(sampleResponse, true);

      expect(service.currentUser()).toEqual(sampleResponse);
    });
  });

  describe('isLoggedIn', () => {
    it('reflects token presence', () => {
      expect(service.isLoggedIn()).toBe(false);

      service.setSession(sampleResponse, true);

      expect(service.isLoggedIn()).toBe(true);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      service.setSession(sampleResponse, true);
    });

    it('posts to the logout endpoint with the stored refresh token', () => {
      service.logout();

      const req = httpMock.expectOne(r => r.url.endsWith('/api/Users/logout'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-token-1' });
      req.flush({});
    });

    it('clears localStorage and sessionStorage', () => {
      service.logout();
      httpMock.expectOne(r => r.url.endsWith('/api/Users/logout')).flush({});

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(localStorage.getItem('current_user')).toBeNull();
      expect(sessionStorage.getItem('access_token')).toBeNull();
      expect(sessionStorage.getItem('current_user')).toBeNull();
    });

    it('clears the currentUser signal', () => {
      service.logout();
      httpMock.expectOne(r => r.url.endsWith('/api/Users/logout')).flush({});

      expect(service.currentUser()).toBeNull();
    });

    it('leaves isLoggedIn() false afterwards', () => {
      service.logout();
      httpMock.expectOne(r => r.url.endsWith('/api/Users/logout')).flush({});

      expect(service.isLoggedIn()).toBe(false);
    });

    it('still clears local state when the backend call fails (fire-and-forget)', () => {
      service.logout();

      const req = httpMock.expectOne(r => r.url.endsWith('/api/Users/logout'));
      req.flush('server error', { status: 500, statusText: 'Internal Server Error' });

      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });
});
