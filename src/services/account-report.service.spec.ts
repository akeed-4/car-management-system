import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { AccountReportService } from './account-report.service';
import { environment } from '../environments/environment';

/**
 * Regression coverage for flattenBalanceSheet's root-node parentId -- dx-tree-list (plain data
 * structure) only recognizes a row as a root when its parentIdExpr value equals the widget's
 * rootValue (default 0). The section-header rows used to omit parentId entirely (undefined),
 * which matched neither the root value nor any real node and made DevExtreme's hierarchy builder
 * throw while constructing the tree on load -- see report-tree.component.html's [rootValue]="0".
 */
describe('AccountReportService.getBalanceSheet', () => {
  let service: AccountReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AccountReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('gives every section-header row parentId 0 so dx-tree-list recognizes them as roots', (done) => {
    service.getBalanceSheet({}).subscribe((rows) => {
      const sectionHeaders = rows.filter((r) => r.level === 0);
      expect(sectionHeaders.length).toBe(3);
      for (const header of sectionHeaders) {
        expect(header.parentId).toBe(0);
      }
      done();
    });

    const req = httpMock.expectOne(`${environment.origin}api/AccountReports/balance-sheet`);
    req.flush({
      assets: {
        sectionName: 'Assets',
        total: 1000,
        accounts: [
          { accountId: 1, accountCode: '1000', accountNameAr: 'نقد', accountNameEn: 'Cash', amount: 1000, level: 1, subAccounts: [] },
        ],
      },
      liabilities: { sectionName: 'Liabilities', total: 0, accounts: [] },
      equity: { sectionName: 'Equity', total: 1000, accounts: [] },
      totalAssets: 1000,
      totalLiabilities: 0,
      totalEquity: 1000,
      isBalanced: true,
    });
  });

  it('links each account row to its own section header, not to another root', (done) => {
    service.getBalanceSheet({}).subscribe((rows) => {
      const assetsHeader = rows.find((r) => r.accountType === 'ASSET' && r.level === 0)!;
      const cashRow = rows.find((r) => r.accountCode === '1000')!;
      expect(cashRow.parentId).toBe(assetsHeader.accountId);
      expect(cashRow.parentId).not.toBe(0);
      done();
    });

    const req = httpMock.expectOne(`${environment.origin}api/AccountReports/balance-sheet`);
    req.flush({
      assets: {
        sectionName: 'Assets',
        total: 500,
        accounts: [
          { accountId: 7, accountCode: '1000', accountNameAr: 'نقد', accountNameEn: 'Cash', amount: 500, level: 1, subAccounts: [] },
        ],
      },
      liabilities: { sectionName: 'Liabilities', total: 0, accounts: [] },
      equity: { sectionName: 'Equity', total: 500, accounts: [] },
      totalAssets: 500,
      totalLiabilities: 0,
      totalEquity: 500,
      isBalanced: true,
    });
  });
});
