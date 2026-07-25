import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TenantContextService, CurrentTenantState } from './tenant-context.service';
import { SelectTenantResponseDto } from '../models/platform/tenant-membership.model';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let httpMock: HttpTestingController;

  const sampleResponse: SelectTenantResponseDto = {
    id: 1,
    name: 'Jane Doe',
    roleName: 'Admin',
    token: 'access-token-1',
    refreshToken: 'refresh-token-1',
    tenantId: 42,
    tenantName: 'Acme Motors',
    tenantCode: 'acme',
    companyLegalName: 'Acme Motors LLC',
    currency: 'SAR',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    logoUrl: 'https://example.com/logo.png',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TenantContextService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('selectTenant', () => {
    it('populates the widened fields (companyLegalName/currency/language/timezone/logoUrl) into current()', done => {
      service.selectTenant(42).subscribe(state => {
        expect(state.companyLegalName).toBe('Acme Motors LLC');
        expect(state.currency).toBe('SAR');
        expect(state.language).toBe('ar');
        expect(state.timezone).toBe('Asia/Riyadh');
        expect(state.logoUrl).toBe('https://example.com/logo.png');
        expect(service.current()).toEqual(state);
        done();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/42/select'));
      req.flush(sampleResponse);
    });

    it('falls back to null for any widened field missing from the response', done => {
      const { companyLegalName, currency, language, timezone, logoUrl, ...minimalResponse } = sampleResponse;

      service.selectTenant(42).subscribe(state => {
        expect(state.companyLegalName).toBeNull();
        expect(state.currency).toBeNull();
        expect(state.language).toBeNull();
        expect(state.timezone).toBeNull();
        expect(state.logoUrl).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/42/select'));
      req.flush(minimalResponse as SelectTenantResponseDto);
    });
  });

  describe('clear', () => {
    it('resets current() and memberships() and removes the persisted selection', done => {
      service.selectTenant(42).subscribe(() => {
        expect(service.current()).not.toBeNull();

        service.clear();

        expect(service.current()).toBeNull();
        expect(service.memberships()).toEqual([]);
        expect(localStorage.getItem('current_tenant')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/api/platform/my/tenants/42/select'));
      req.flush(sampleResponse);
    });
  });

  describe('restoreFromStorage', () => {
    it('returns null and does not throw when localStorage holds corrupt JSON', () => {
      localStorage.setItem('current_tenant', '{not-valid-json');

      const result = service.restoreFromStorage();

      expect(result).toBeNull();
      expect(service.current()).toBeNull();
      expect(localStorage.getItem('current_tenant')).toBeNull();
    });

    it('restores a previously persisted selection', () => {
      const state: CurrentTenantState = {
        tenantId: 7,
        tenantName: 'Stored Co',
        companyCode: 'stored',
        subscriptionId: null,
        planId: null,
        companyLegalName: null,
        currency: null,
        language: null,
        timezone: null,
        logoUrl: null,
      };
      localStorage.setItem('current_tenant', JSON.stringify(state));

      const result = service.restoreFromStorage();

      expect(result).toEqual(state);
      expect(service.current()).toEqual(state);
    });
  });
});
