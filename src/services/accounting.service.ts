import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  SalesReturn,
  PurchaseReturn,
  JournalEntry,
  PurchaseReturnJournalEntry,
  ChartOfAccount
} from '../types/sales-return.model';

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private apiUrl = '/api/accounting';

  constructor(private http: HttpClient) {}

  /**
   * Create automatic journal entries for sales return
   * Entry structure:
   * - Debit: Sales Revenue (4020) - for sales return
   * - Debit: VAT Payable (2010) - to reverse VAT
   * - Credit: Cash/Bank (1010) - for refund
   * - Credit: Customer Deposits (1030) - if deposit is refundable
   */
  createSalesReturnEntry(salesReturn: SalesReturn): JournalEntry[] {
    const entries: JournalEntry[] = [];
    const reference = `SR-${salesReturn.returnNo}`;
    const entryDate = new Date();

    // Entry 1: Debit Sales Returns & Allowances
    entries.push({
      accountCode: '4020',
      accountName: 'Sales Returns & Allowances',
      debit: salesReturn.salePrice,
      credit: 0,
      entryDate,
      reference,
      description: `Sales return for VIN: ${salesReturn.vin}, Invoice: ${salesReturn.invoiceId}`
    });

    // Entry 2: Debit VAT Receivable (reverse VAT)
    entries.push({
      accountCode: '2020',
      accountName: 'VAT Receivable',
      debit: salesReturn.vatAmount,
      credit: 0,
      entryDate,
      reference,
      description: `VAT reversal for sales return: ${salesReturn.vin}`
    });

    // Entry 3: Credit Cash/Bank for main refund
    entries.push({
      accountCode: '1010',
      accountName: 'Cash - Bank',
      debit: 0,
      credit: salesReturn.salePrice + salesReturn.vatAmount,
      entryDate,
      reference,
      description: `Refund payment for sales return: ${salesReturn.vin}`
    });

    // Entry 4: If deposit is refundable, credit customer deposits
    if (salesReturn.depositRefundable && salesReturn.depositAmount > 0) {
      entries.push({
        accountCode: '1030',
        accountName: 'Customer Deposits',
        debit: 0,
        credit: salesReturn.depositAmount,
        entryDate,
        reference,
        description: `Deposit refund for customer return: ${salesReturn.vin}`
      });
    }

    return entries;
  }

  /**
   * Create automatic journal entries for purchase return
   * Entry structure:
   * - Debit: Supplier Payables (2030) - to reduce payable to supplier
   * - Debit: Inventory (1040) - to restore inventory
   * - Credit: Cash/Bank (1010) - for payment to supplier
   * - Credit: VAT Receivable (2020) - to reverse VAT
   */
  createPurchaseReturnEntry(purchaseReturn: PurchaseReturn): PurchaseReturnJournalEntry[] {
    const entries: PurchaseReturnJournalEntry[] = [];
    const reference = `PR-${purchaseReturn.returnNo}`;
    const entryDate = new Date();

    // Entry 1: Debit Supplier Payables
    entries.push({
      purchaseReturnId: purchaseReturn.id || 0,
      accountCode: '2030',
      accountName: 'Supplier Payables',
      debit: purchaseReturn.purchasePrice + purchaseReturn.vatAmount,
      credit: 0,
      entryDate,
      reference,
      description: `Purchase return to supplier for VIN: ${purchaseReturn.vin}`
    });

    // Entry 2: Debit Inventory - Cars (restore to inventory)
    entries.push({
      purchaseReturnId: purchaseReturn.id || 0,
      accountCode: '1040',
      accountName: 'Inventory - Cars',
      debit: purchaseReturn.purchasePrice,
      credit: 0,
      entryDate,
      reference,
      description: `Restore inventory for returned car: ${purchaseReturn.vin}`
    });

    // Entry 3: Credit Cash/Bank for payment
    entries.push({
      purchaseReturnId: purchaseReturn.id || 0,
      accountCode: '1010',
      accountName: 'Cash - Bank',
      debit: 0,
      credit: purchaseReturn.refundableAmount,
      entryDate,
      reference,
      description: `Refund payment from supplier for return: ${purchaseReturn.vin}`
    });

    // Entry 4: Credit VAT Receivable (reverse VAT)
    entries.push({
      purchaseReturnId: purchaseReturn.id || 0,
      accountCode: '2020',
      accountName: 'VAT Receivable',
      debit: 0,
      credit: purchaseReturn.vatAmount,
      entryDate,
      reference,
      description: `VAT reversal for purchase return: ${purchaseReturn.vin}`
    });

    // Entry 5: If deposit refundable
    if (purchaseReturn.depositRefundable && purchaseReturn.depositAmount > 0) {
      entries.push({
        purchaseReturnId: purchaseReturn.id || 0,
        accountCode: '1030',
        accountName: 'Customer Deposits',
        debit: purchaseReturn.depositAmount,
        credit: 0,
        entryDate,
        reference,
        description: `Restore deposit for returned car: ${purchaseReturn.vin}`
      });
    }

    return entries;
  }

  /**
   * Save journal entries to database
   */
  saveSalesReturnEntries(entries: JournalEntry[], salesReturnId: number): Observable<JournalEntry[]> {
    return this.http.post<JournalEntry[]>(
      `${this.apiUrl}/sales-return/${salesReturnId}/entries`,
      entries
    );
  }

  /**
   * Save purchase return entries to database
   */
  savePurchaseReturnEntries(
    entries: PurchaseReturnJournalEntry[],
    purchaseReturnId: number
  ): Observable<PurchaseReturnJournalEntry[]> {
    return this.http.post<PurchaseReturnJournalEntry[]>(
      `${this.apiUrl}/purchase-return/${purchaseReturnId}/entries`,
      entries
    );
  }

  /**
   * Get chart of accounts
   */
  getChartOfAccounts(): Observable<ChartOfAccount[]> {
    return this.http.get<ChartOfAccount[]>(`${this.apiUrl}/chart-of-accounts`);
  }

  /**
   * Get account by code
   */
  getAccountByCode(code: string): Observable<ChartOfAccount> {
    return this.http.get<ChartOfAccount>(`${this.apiUrl}/chart-of-accounts/${code}`);
  }

  /**
   * Get journal entries for sales return
   */
  getSalesReturnEntries(salesReturnId: number): Observable<JournalEntry[]> {
    return this.http.get<JournalEntry[]>(
      `${this.apiUrl}/sales-return/${salesReturnId}/entries`
    );
  }

  /**
   * Get journal entries for purchase return
   */
  getPurchaseReturnEntries(purchaseReturnId: number): Observable<PurchaseReturnJournalEntry[]> {
    return this.http.get<PurchaseReturnJournalEntry[]>(
      `${this.apiUrl}/purchase-return/${purchaseReturnId}/entries`
    );
  }

  /**
   * Calculate trial balance for a period
   */
  getTrialBalance(startDate: Date, endDate: Date): Observable<any> {
    return this.http.get(`${this.apiUrl}/trial-balance`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }

  /**
   * Generate accounting report
   */
  generateAccountingReport(reportType: string, startDate: Date, endDate: Date): Observable<any> {
    return this.http.get(`${this.apiUrl}/reports/${reportType}`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  }
}
