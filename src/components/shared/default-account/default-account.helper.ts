import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { AccountingService, DefaultAccountKind, DefaultAccountResult, ResolveDefaultAccountRequest } from '../../accounting/accounting.service';

/**
 * The single place every Debit/Credit account field implements the "default account + manual
 * override" UX standard: on load and whenever the underlying business data changes (customer/
 * supplier/store/payment method), the field is pre-populated with the backend-resolved default,
 * but the user can always pick a different account -- and once they do, later recalculations must
 * not clobber that choice. Never re-implement this tracking inline in a component; call
 * DefaultAccountTracker.attach and drive it from whichever field(s) the screen's default actually
 * depends on.
 *
 * Usage:
 *   const debitTracker = new DefaultAccountTracker(this.accountingService, this.form.get('debitAccountId') as FormControl);
 *   // whenever the business input changes (e.g. supplier selection):
 *   debitTracker.recalculate({ kind: DefaultAccountKind.SupplierPayable, partyId: supplierId });
 */
export class DefaultAccountTracker {
  /** True once the user has typed/selected a value into the control themselves, as opposed to a
   *  value this tracker wrote via recalculate(). Exposed read-only so templates can show a
   *  "manually selected" hint or enable a "Reset to Default" action. */
  private _manuallyChanged = false;
  private _lastResolved: DefaultAccountResult | null = null;
  private _applyingDefault = false;

  constructor(
    private readonly accountingService: AccountingService,
    private readonly control: FormControl
  ) {
    // Any value change NOT caused by this tracker's own recalculate()/reset() writes is treated
    // as the user manually picking an account -- from then on, recalculate() no longer overwrites
    // the control until the user (or the caller, via reset()) explicitly asks to go back to default.
    control.valueChanges.subscribe(() => {
      if (!this._applyingDefault) {
        this._manuallyChanged = true;
      }
    });
  }

  get manuallyChanged(): boolean {
    return this._manuallyChanged;
  }

  /**
   * Explicitly marks the field as manually overridden without touching the control's value.
   * Use when a screen constructs the tracker AFTER the control already holds a real saved value
   * (e.g. an edit-mode form built via `new FormControl(invoice.savedAccountId)` rather than a
   * later `patchValue`, which the constructor's own valueChanges subscription never observes) --
   * without this, a subsequent recalculate() could silently overwrite that saved value with a
   * freshly resolved default the first time the business context is (re-)evaluated.
   */
  markAsManuallyChanged(): void {
    this._manuallyChanged = true;
  }

  get lastResolved(): DefaultAccountResult | null {
    return this._lastResolved;
  }

  /**
   * Re-derives the default from the current business context and, unless the user has manually
   * overridden the field, writes it into the control. Safe to call on every relevant field change
   * (e.g. every keystroke settling on a new supplier) -- once manuallyChanged is true this becomes
   * a no-op that only refreshes lastResolved (used by resolveOnly/preview UI), never touching the
   * control itself.
   * Returns the resolved value for callers that want to show it even while not applying it (e.g. a
   * "default would be X" hint next to an overridden field).
   */
  recalculate(request: ResolveDefaultAccountRequest): Observable<DefaultAccountResult> {
    const result$ = this.accountingService.resolveDefaultAccount(request);
    result$.subscribe((result) => {
      this._lastResolved = result;
      if (!this._manuallyChanged && result.accountId) {
        this._applyingDefault = true;
        this.control.setValue(result.accountId);
        this._applyingDefault = false;
      }
    });
    return result$;
  }

  /** "Reset to Default" action: clears the manual-override flag and re-applies the last resolved
   *  default immediately (if any). Call recalculate() again first if the business context may have
   *  changed since the override was made. */
  reset(): void {
    this._manuallyChanged = false;
    if (this._lastResolved?.accountId) {
      this._applyingDefault = true;
      this.control.setValue(this._lastResolved.accountId);
      this._applyingDefault = false;
    }
  }
}

export { DefaultAccountKind };
