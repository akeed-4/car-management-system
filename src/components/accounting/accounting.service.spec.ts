import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { AccountingService } from './accounting.service';
import { Account, CreateAccountDto } from './models';

/** The service constructor eagerly fires getAccounts()/getJournalEntries(); flushing keeps
 * HttpTestingController.verify() happy without coupling every test to bootstrap traffic. */
function flushBootstrapRequests(httpMock: HttpTestingController): void {
  httpMock
    .match(r => r.url.includes('/api/Accounting') || r.url.includes('/api/JournalEntries'))
    .forEach(req => req.flush([]));
}

describe('AccountingService - save account (createAccount)', () => {
  let service: AccountingService;
  let httpMock: HttpTestingController;

  const baseDto: CreateAccountDto = {
    accountCode: '1103',
    accountNameAr: 'حساب بنك جديد',
    accountNameEn: 'New Bank Account',
    Type: 'ASSET',
    accountId: 0,
    companyId: 1,
    accountCategoryId: 2,
    accountTypeId: 5,
    accountLevel: 2,
    isMainAccount: false,
    mainAccountId: 101,
    mainAccountCode: '1100',
    mainAccountName: 'البنوك',
    currencyId: null,
    hasCostCenter: false,
    costCenterId: 0,
    isRetired: false,
    isActive: true,
    inActiveReasons: '',
    isPrivate: false,
    hasRemarks: false,
    remarksAr: '',
    remarksEn: '',
    notesAr: '',
    notesEn: '',
    createNewClient: false,
    createNewSupplier: false,
    createNewBank: false,
    customerId: null,
    customerName: '',
    supplierId: null,
    supplierName: '',
    bankId: null,
    bankName: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslateService, useValue: { instant: (key: string) => key } },
      ],
    });

    service = TestBed.inject(AccountingService);
    httpMock = TestBed.inject(HttpTestingController);
    flushBootstrapRequests(httpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('POSTs the DTO to api/Accounting/CreateAccount with JSON headers', () => {
    let result: Account | undefined;
    service.createAccount(baseDto).subscribe(account => (result = account));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(baseDto);
    expect(req.request.headers.get('Content-Type')).toContain('application/json');
    expect(req.request.headers.get('Accept')).toContain('application/json');

    const created = { id: 55, ...baseDto } as unknown as Account;
    req.flush(created);
    expect(result).toEqual(created);
  });

  it('appends the saved account to the local accounts$ cache', () => {
    const cacheSnapshots: Account[][] = [];
    const subscription = service.accounts$.subscribe(accounts => cacheSnapshots.push([...accounts]));

    service.createAccount(baseDto).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    req.flush({ id: 55, ...baseDto, parentId: null } as unknown as Account);

    // Snapshot[0] is the initial empty state; snapshot[last] must contain the new account.
    const latestCache = cacheSnapshots[cacheSnapshots.length - 1];
    expect(latestCache.some(a => a.id === 55)).toBe(true);
    subscription.unsubscribe();
  });

  it('derives parentId from mainAccountId for a sub-account (isMainAccount=false)', done => {
    service.createAccount(baseDto).subscribe(account => {
      expect(account.parentId).toBe(101);
      done();
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    req.flush({ id: 55, ...baseDto, parentId: null } as unknown as Account);
  });

  it('keeps main-account fields untouched for a main account (isMainAccount=true)', done => {
    const mainDto: CreateAccountDto = { ...baseDto, isMainAccount: true, mainAccountId: 0 };

    service.createAccount(mainDto).subscribe(account => {
      expect(account.isMainAccount).toBe(true);
      expect(account.mainAccountId ?? 0).toBe(0);
      done();
    });

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    req.flush({ id: 56, ...mainDto, mainAccountId: null } as unknown as Account);
  });

  it('emits refresh$ after a successful save', () => {
    let refreshed = false;
    const refreshSub = service.refresh$.subscribe(() => (refreshed = true));

    service.createAccount(baseDto).subscribe();

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    req.flush({ id: 57, ...baseDto } as unknown as Account);

    expect(refreshed).toBe(true);
    refreshSub.unsubscribe();
  });

  it('re-throws the real HttpErrorResponse instead of swallowing it', async () => {
    const savePromise = firstValueFrom(service.createAccount(baseDto));

    const req = httpMock.expectOne(r => r.url.endsWith('/api/Accounting/CreateAccount'));
    req.flush({ message: 'كود الحساب مستخدم مسبقاً' }, { status: 400, statusText: 'Bad Request' });

    const error = await savePromise.then(
      v => { throw new Error(`expected the save to fail but resolved with ${JSON.stringify(v)}`); },
      err => err,
    );
    // The service deliberately re-throws the raw backend error (not a generic Error) so
    // AddAccountComponent.extractErrorMessage can surface e.g. duplicate-account-code reasons.
    // Asserted via duck-typing because Jest can load @angular/common twice (instanceof across
    // bundle copies is unreliable); constructor identity is exactly what we care about.
    expect(error?.constructor?.name).toBe('HttpErrorResponse');
    expect(error.status).toBe(400);
    expect(error.error?.message).toBe('كود الحساب مستخدم مسبقاً');
  });
});