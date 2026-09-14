import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../environments/environment';
import { PaymentMethod, CreatePaymentMethodDto, UpdatePaymentMethodDto, findDefaultPaymentMethod } from '../models/payment-method.model';

/**
 * Single source of truth for Payment Methods master data. Every document with a Payment Method
 * dropdown (Sales Invoice, Purchase Invoice, Receipt, Payment Voucher, Deposit, ...) reads
 * `activePaymentMethods$` instead of hardcoding its own list -- see this service's `getActive()`.
 */
@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private readonly baseUrl = `${environment.origin}api/PaymentMethods`;

  private activeMethodsSubject = new BehaviorSubject<PaymentMethod[]>([]);
  /** Only active payment methods -- the list every document dropdown should bind to. Loaded once
   *  at service construction (same singleton-cache pattern as AccountingService.accounts$) and
   *  refreshed after any create/update/delete/activate-deactivate made through this service, so
   *  every open document picks up master-data changes without a page reload. */
  public activePaymentMethods$ = this.activeMethodsSubject.asObservable();

  /** The one default Payment Method (at most one active method per tenant/company scope carries
   *  `isDefault`), resolved live from the Payment Methods master. Documents needing an AUTOMATIC
   *  payment method subscribe here or call `getDefault()` -- never hardcode an id and never
   *  derive the default from the Account. Emits `null` when no default is configured. */
  public defaultPaymentMethod$ = this.activePaymentMethods$.pipe(map(findDefaultPaymentMethod));

  constructor(private http: HttpClient) {
    this.refreshActive();
  }

  private refreshActive(): void {
    this.getActive().subscribe({ error: () => {} });
  }

  /** Active-only list, for document dropdowns. */
  getActive(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.baseUrl}/GetAll`, { params: { activeOnly: 'true' } }).pipe(
      tap(methods => this.activeMethodsSubject.next(methods)),
      catchError(() => of([]))
    );
  }

  /** One-shot resolution of the current default Payment Method (or `null` when none is set),
   *  read from the Payment Methods master table itself. */
  getDefault(): Observable<PaymentMethod | null> {
    return this.getActive().pipe(map(findDefaultPaymentMethod));
  }

  /** Full list (active + inactive), for the Payment Methods master screen. */
  getAll(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.baseUrl}/GetAll`);
  }

  getById(id: number): Observable<PaymentMethod> {
    return this.http.get<PaymentMethod>(`${this.baseUrl}/GetById/${id}`);
  }

  create(dto: CreatePaymentMethodDto): Observable<PaymentMethod> {
    return this.http.post<PaymentMethod>(`${this.baseUrl}/Create`, dto).pipe(
      tap(() => this.refreshActive())
    );
  }

  update(id: number, dto: UpdatePaymentMethodDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Update/${id}`, dto).pipe(
      tap(() => this.refreshActive())
    );
  }

  setActive(id: number, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/SetActive`, isActive).pipe(
      tap(() => this.refreshActive())
    );
  }

  /** Makes the given Payment Method the scope's ONLY default: the backend clears `isDefault`
   *  from the previous default in the same transaction, so at most one default can exist.
   *  Only ACTIVE methods are eligible -- the backend rejects inactive ones. */
  setDefault(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/SetDefault`, null).pipe(
      tap(() => this.refreshActive())
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Delete/${id}`).pipe(
      tap(() => this.refreshActive())
    );
  }
}
