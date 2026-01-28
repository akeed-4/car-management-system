import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { ReportFilter, AccountBalanceReport, BalanceSheetReport, TrialBalanceReport, GeneralJournalReport, AccountStatementReport, BusinessActivityReport } from '../models/reportmodel';

@Injectable({
  providedIn: 'root'
})
export class AccountReportService {
  private apiUrl = `${environment.origin}/reports`;

  constructor(private http: HttpClient) {}

  /**
   * Get Account Balance Report
   */
  getAccountBalance(filters: ReportFilter): Observable<AccountBalanceReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<AccountBalanceReport[]>(`${this.apiUrl}/account-balance`, { params });
  }

  /**
   * Get Balance Sheet Report
   */
  getBalanceSheet(filters: ReportFilter): Observable<BalanceSheetReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<BalanceSheetReport[]>(`${this.apiUrl}/balance-sheet`, { params });
  }

  /**
   * Get Trial Balance Report
   */
  getTrialBalance(filters: ReportFilter): Observable<TrialBalanceReport[]> {
    const params = this.buildHttpParams(filters);
    return this.http.get<TrialBalanceReport[]>(`${this.apiUrl}/trial-balance`, { params });
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
