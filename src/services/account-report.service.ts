import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, map, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ReportFilter, AccountBalanceReport, BalanceSheetReport, TrialBalanceReport, GeneralJournalReport, AccountStatementReport, BusinessActivityReport } from '../models/reportmodel';
import { CurrentSettingService } from './current-setting.service';
import { LanguageService } from './language.service';

/** Wire shapes this service maps onto the frontend report models -- mirror the C# response DTOs
 *  field-for-field (CarERP.Core.DTOs.Reports.*), camelCase per the default ASP.NET JSON
 *  serializer. Declared here (not as `any`) so the mapping below is type-checked against what the
 *  backend actually sends, rather than trusting property names that may not exist at runtime. */
interface AccountBalanceReportItemWire {
  accountId: number; accountCode: string; accountNameAr: string; accountNameEn: string;
  accountType: string; openingBalance: number; totalDebit: number; totalCredit: number;
  closingBalance: number; level: number; parentId?: number | null; hasChildren: boolean;
}
interface AccountBalanceReportResponseWire {
  accounts: AccountBalanceReportItemWire[];
  totalDebits: number; totalCredits: number; netBalance: number;
}
interface TrialBalanceItemWire {
  accountId: number; accountCode: string; accountNameAr: string; accountNameEn: string;
  accountType: string; level: number;
  openingDebit: number; openingCredit: number;
  periodDebit: number; periodCredit: number;
  closingDebit: number; closingCredit: number;
}
interface TrialBalanceDtoWire {
  items: TrialBalanceItemWire[];
  totalOpeningDebit: number; totalOpeningCredit: number;
  totalPeriodDebit: number; totalPeriodCredit: number;
  totalClosingDebit: number; totalClosingCredit: number;
  isBalanced: boolean;
}
interface BalanceSheetAccountWire {
  accountId: number; accountCode: string; accountNameAr: string; accountNameEn: string;
  amount: number; level: number; parentId?: number | null; subAccounts: BalanceSheetAccountWire[];
}
interface BalanceSheetSectionWire { sectionName: string; accounts: BalanceSheetAccountWire[]; total: number; }
interface BalanceSheetDtoWire {
  assets: BalanceSheetSectionWire; liabilities: BalanceSheetSectionWire; equity: BalanceSheetSectionWire;
  totalAssets: number; totalLiabilities: number; totalEquity: number; isBalanced: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccountReportService {
  // AccountReportsController is `[Route("api/[controller]")]` -> `api/AccountReports`, and every
  // report-generation action on it is `[HttpPost]` with a `[FromBody]` request DTO (see
  // AccountReportsController.cs) -- this used to point at `{origin}reports` and issue plain GETs
  // with query params, which never matched any real route (a guaranteed 404/"failed to load" for
  // every report below).
  private apiUrl = `${environment.origin}api/AccountReports`;
  private currentSettingService = inject(CurrentSettingService);
  private languageService = inject(LanguageService);

  constructor(private http: HttpClient) {}

  private get arabic(): boolean {
    return this.languageService.getCurrentLanguage() !== 'en';
  }

  private displayName(nameAr: string, nameEn: string): string {
    return (this.arabic ? nameAr : nameEn) || nameEn || nameAr;
  }

  /** ReportFilter's startDate/endDate are the one shared shape every report screen's
   *  report-container emits; each backend request DTO calls the same concept FromDate/ToDate (or,
   *  for Balance Sheet, a single AsOfDate). undefined fields are simply omitted from the JSON
   *  body, matching each request DTO's nullable/optional/defaulted fields. */
  private toDateString(value?: Date | string): string | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value.toISOString() : value;
  }

  /**
   * Get Account Balance Report -- POSTs AccountBalanceReportRequest, then flattens the
   * `{ accounts, totalDebits, totalCredits, netBalance }` response envelope into the plain
   * AccountBalanceReport[] the grid renders (CompanyId is optional on this endpoint -- a
   * null/undefined CompanyId matches every company, per GetAccountBalanceReportAsync).
   */
  getAccountBalance(filters: ReportFilter): Observable<AccountBalanceReport[]> {
    const body = {
      FromDate: this.toDateString(filters.startDate),
      ToDate: this.toDateString(filters.endDate),
    };
    return this.http.post<AccountBalanceReportResponseWire>(`${this.apiUrl}/account-balance`, body).pipe(
      map(response => (response.accounts ?? []).map(a => ({
        accountId: a.accountId,
        accountCode: a.accountCode,
        accountName: this.displayName(a.accountNameAr, a.accountNameEn),
        debit: a.totalDebit,
        credit: a.totalCredit,
        balance: a.closingBalance,
        balanceType: a.closingBalance < 0 ? 'Credit' : 'Debit',
      } satisfies AccountBalanceReport))),
    );
  }

  /**
   * Get Balance Sheet Report -- POSTs BalanceSheetRequest (CompanyId is REQUIRED and strictly
   * filtered on server-side, unlike Account Balance/Trial Balance's optional CompanyId, so this
   * always sends the current company). Flattens the nested Assets/Liabilities/Equity sections
   * (each with recursively nested SubAccounts) into the parentId-linked flat list
   * ReportTreeComponent expects (see balance-sheet.component.html's keyExpr="accountId"/
   * parentIdExpr="parentId"): one synthetic section-header row per section (negative id, so it
   * can never collide with a real AccountId), followed by its accounts/sub-accounts.
   */
  getBalanceSheet(filters: ReportFilter): Observable<BalanceSheetReport[]> {
    const body = {
      AsOfDate: this.toDateString(filters.endDate) ?? new Date().toISOString(),
      CompanyId: this.currentSettingService.getCompanyId(),
    };
    return this.http.post<BalanceSheetDtoWire>(`${this.apiUrl}/balance-sheet`, body).pipe(
      map(response => this.flattenBalanceSheet(response)),
    );
  }

  private flattenBalanceSheet(dto: BalanceSheetDtoWire): BalanceSheetReport[] {
    const rows: BalanceSheetReport[] = [];
    const sections: { labelKey: 'ASSET' | 'LIABILITY' | 'EQUITY'; section: BalanceSheetSectionWire }[] = [
      { labelKey: 'ASSET', section: dto.assets },
      { labelKey: 'LIABILITY', section: dto.liabilities },
      { labelKey: 'EQUITY', section: dto.equity },
    ];
    let syntheticId = -1;
    const addAccounts = (accounts: BalanceSheetAccountWire[], parentId: number, level: number, type: string) => {
      for (const account of accounts ?? []) {
        rows.push({
          accountId: account.accountId,
          accountCode: account.accountCode,
          accountName: this.displayName(account.accountNameAr, account.accountNameEn),
          accountType: type,
          amount: account.amount,
          level,
          parentId,
          hasChildren: (account.subAccounts?.length ?? 0) > 0,
        });
        if (account.subAccounts?.length) {
          addAccounts(account.subAccounts, account.accountId, level + 1, type);
        }
      }
    };
    for (const { labelKey, section } of sections) {
      const sectionId = syntheticId--;
      rows.push({
        accountId: sectionId,
        accountCode: '',
        accountName: section.sectionName || labelKey,
        accountType: labelKey,
        amount: section.total,
        level: 0,
        hasChildren: (section.accounts?.length ?? 0) > 0,
      });
      addAccounts(section.accounts, sectionId, 1, labelKey);
    }
    return rows;
  }

  /**
   * Get Trial Balance Report -- POSTs TrialBalanceRequest (CompanyId is REQUIRED, same as
   * Balance Sheet) and flattens the `{ items, totalOpeningDebit, ... }` response envelope into
   * TrialBalanceReport[].
   */
  getTrialBalance(filters: ReportFilter): Observable<TrialBalanceReport[]> {
    const body = {
      FromDate: this.toDateString(filters.startDate),
      ToDate: this.toDateString(filters.endDate),
      CompanyId: this.currentSettingService.getCompanyId(),
    };
    return this.http.post<TrialBalanceDtoWire>(`${this.apiUrl}/trial-balance`, body).pipe(
      map(response => (response.items ?? []).map(i => ({
        accountId: i.accountId,
        accountCode: i.accountCode,
        accountName: this.displayName(i.accountNameAr, i.accountNameEn),
        openingDebit: i.openingDebit,
        openingCredit: i.openingCredit,
        periodDebit: i.periodDebit,
        periodCredit: i.periodCredit,
        closingDebit: i.closingDebit,
        closingCredit: i.closingCredit,
      } satisfies TrialBalanceReport))),
    );
  }

  /**
   * Get General Journal Report
   */
  getGeneralJournal(filters: ReportFilter): Observable<GeneralJournalReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<GeneralJournalReport[]>(`${this.apiUrl}/general-journal`, { params });
  }

  /**
   * Get Account Statement Report
   */
  getAccountStatement(filters: ReportFilter): Observable<AccountStatementReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<AccountStatementReport[]>(`${this.apiUrl}/account-statement`, { params });
  }

  /**
   * Get Business Activity Report
   */
  getBusinessActivity(filters: ReportFilter): Observable<BusinessActivityReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<BusinessActivityReport[]>(`${this.apiUrl}/business-activity`, { params });
  }

  /**
   * Export report to PDF
   */
  exportToPdf(reportType: string, filters: ReportFilter): Observable<Blob> {
    const params = this.buildHttpParams(filters);
    return this.http.get(`${this.apiUrl}/${reportType}/export/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Export report to Excel
   */
  exportToExcel(reportType: string, filters: ReportFilter): Observable<Blob> {
    const params = this.buildHttpParams(filters);
    return this.http.get(`${this.apiUrl}/${reportType}/export/excel`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Build HTTP parameters from filter object
   */
  private buildHttpParams(filters: ReportFilter): HttpParams {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }
}
