import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesReturn, PurchaseReturn, ReturnRequest } from '../types/sales-return.model';
import { SalesInvoice } from '../types/sales-invoice.model';
import { PurchaseInvoice } from '../types/purchase-invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceIntegrationService {
  private apiUrl = '/api/invoices';
  private inventoryUrl = '/api/inventory';

  constructor(private http: HttpClient) {}

  // ============== SALES INVOICE INTEGRATION ==============

  /**
   * Fetch sales invoice details by invoice number and prepare return data
   */
  getSalesInvoiceForReturn(invoiceNo: string | number): Observable<{
    invoice: SalesInvoice;
    returnRequest: Partial<ReturnRequest>;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/sales/${invoiceNo}/prepare-return`
    );
  }

  /**
   * Fetch sales invoice by ID for return
   */
  getSalesInvoiceById(invoiceId: number): Observable<SalesInvoice> {
    return this.http.get<SalesInvoice>(`${this.apiUrl}/sales/${invoiceId}`);
  }

  /**
   * Get all sales invoices for a customer that are eligible for return
   */
  getEligibleSalesInvoices(customerId: number): Observable<SalesInvoice[]> {
    return this.http.get<SalesInvoice[]>(
      `${this.apiUrl}/sales/customer/${customerId}/eligible-returns`
    );
  }

  /**
   * Get sales returns history for an invoice
   */
  getSalesReturnHistory(invoiceId: number): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(
      `${this.apiUrl}/sales/${invoiceId}/return-history`
    );
  }

  // ============== PURCHASE INVOICE INTEGRATION ==============

  /**
   * Fetch purchase invoice details by invoice number and prepare return data
   */
  getPurchaseInvoiceForReturn(invoiceNo: string | number): Observable<{
    invoice: PurchaseInvoice;
    returnRequest: Partial<ReturnRequest>;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/purchase/${invoiceNo}/prepare-return`
    );
  }

  /**
   * Fetch purchase invoice by ID for return
   */
  getPurchaseInvoiceById(invoiceId: number): Observable<PurchaseInvoice> {
    return this.http.get<PurchaseInvoice>(`${this.apiUrl}/purchase/${invoiceId}`);
  }

  /**
   * Get all purchase invoices for a supplier that are eligible for return
   */
  getEligiblePurchaseInvoices(supplierId: number): Observable<PurchaseInvoice[]> {
    return this.http.get<PurchaseInvoice[]>(
      `${this.apiUrl}/purchase/supplier/${supplierId}/eligible-returns`
    );
  }

  /**
   * Get purchase returns history for an invoice
   */
  getPurchaseReturnHistory(invoiceId: number): Observable<PurchaseReturn[]> {
    return this.http.get<PurchaseReturn[]>(
      `${this.apiUrl}/purchase/${invoiceId}/return-history`
    );
  }

  // ============== INVENTORY MANAGEMENT ==============

  /**
   * Update car status after sales return approval
   * Changes status from 'Sold' or 'Reserved' to 'Available'
   */
  updateCarStatusAfterSalesReturn(carId: number): Observable<any> {
    return this.http.patch<any>(
      `${this.inventoryUrl}/cars/${carId}/status`,
      { status: 'AVAILABLE', lastReturnDate: new Date() }
    );
  }

  /**
   * Update car status after purchase return approval
   * Changes status to 'RESTOCKING' or 'AVAILABLE'
   */
  updateCarStatusAfterPurchaseReturn(carId: number, status: string = 'AVAILABLE'): Observable<any> {
    return this.http.patch<any>(
      `${this.inventoryUrl}/cars/${carId}/status`,
      { status, lastReturnDate: new Date(), returnStatus: 'RETURNED' }
    );
  }

  /**
   * Adjust inventory records after return
   * Updates quantities and cost basis
   */
  adjustInventoryAfterReturn(carId: number, adjustmentData: any): Observable<any> {
    return this.http.post<any>(
      `${this.inventoryUrl}/adjustments`,
      {
        carId,
        type: 'RETURN',
        ...adjustmentData
      }
    );
  }

  /**
   * Get car details with inventory info
   */
  getCarInventoryInfo(carId: number): Observable<any> {
    return this.http.get<any>(`${this.inventoryUrl}/cars/${carId}/inventory`);
  }

  /**
   * Get car details by VIN
   */
  getCarByVin(vin: string): Observable<any> {
    return this.http.get<any>(`${this.inventoryUrl}/cars/vin/${vin}`);
  }

  // ============== RETURN VALIDATION ==============

  /**
   * Validate if a car can be returned
   * Checks eligibility, time limits, previous returns, etc.
   */
  validateReturnEligibility(carId: number, invoiceId: number, type: 'sales' | 'purchase'): Observable<{
    isEligible: boolean;
    reason?: string;
    timeRemaining?: number;
    previousReturns?: number;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/${type}/${invoiceId}/validate-return/${carId}`
    );
  }

  /**
   * Check for duplicate returns
   */
  checkDuplicateReturn(carId: number, invoiceId: number): Observable<{
    hasPendingReturn: boolean;
    hasApprovedReturn: boolean;
    returnDetails?: SalesReturn | PurchaseReturn;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/returns/check-duplicate`,
      {
        params: { carId, invoiceId }
      }
    );
  }

  // ============== REFUND CALCULATION ==============

  /**
   * Calculate refund amounts for sales return
   * Considers depreciation, restocking fees, VAT, deposits
   */
  calculateSalesReturnRefund(carData: any): Observable<{
    originalPrice: number;
    depreciation: number;
    restockingFee: number;
    refundableAmount: number;
    vatAmount: number;
    depositRefundable: boolean;
    depositAmount: number;
    netRefund: number;
  }> {
    return this.http.post<any>(
      `${this.apiUrl}/sales/calculate-refund`,
      carData
    );
  }

  /**
   * Calculate refund amounts for purchase return
   * Considers restocking fees, VAT, deposits
   */
  calculatePurchaseReturnRefund(carData: any): Observable<{
    originalPrice: number;
    restockingFee: number;
    refundableAmount: number;
    vatAmount: number;
    depositRefundable: boolean;
    depositAmount: number;
    netRefund: number;
  }> {
    return this.http.post<any>(
      `${this.apiUrl}/purchase/calculate-refund`,
      carData
    );
  }

  // ============== INVOICE RECONCILIATION ==============

  /**
   * Reconcile invoice after return approval
   * Updates invoice totals, VAT, paid amounts
   */
  reconcileSalesInvoice(invoiceId: number): Observable<SalesInvoice> {
    return this.http.post<SalesInvoice>(
      `${this.apiUrl}/sales/${invoiceId}/reconcile`,
      {}
    );
  }

  /**
   * Reconcile purchase invoice after return approval
   */
  reconcilePurchaseInvoice(invoiceId: number): Observable<PurchaseInvoice> {
    return this.http.post<PurchaseInvoice>(
      `${this.apiUrl}/purchase/${invoiceId}/reconcile`,
      {}
    );
  }

  /**
   * Get invoice reconciliation report
   */
  getInvoiceReconciliationReport(invoiceId: number, type: 'sales' | 'purchase'): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${type}/${invoiceId}/reconciliation-report`
    );
  }
}
