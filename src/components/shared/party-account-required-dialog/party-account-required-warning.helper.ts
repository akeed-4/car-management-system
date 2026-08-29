import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap } from 'rxjs';
import { PartyAccountRequiredDialogComponent, PartyAccountRequiredData, PartyAccountRequiredResult } from './party-account-required-dialog.component';

/**
 * The single place every credit/term document form checks whether a selected Customer/Supplier
 * has a usable Accounts Receivable/Payable account before letting the user proceed to save.
 * Mirrors warnIfStoreNotConfigured (store-accounting-setup-warning.helper.ts) exactly: never
 * duplicate this dialog.open call inline in a screen, call this helper instead so every screen
 * behaves identically.
 *
 * Takes the already-selected status check (`CustomerService.hasReceivableAccount(id)` or
 * `SupplierService.hasPayableAccount(id)`) as an Observable instead of the two services directly,
 * so a screen that only ever checks one party type (e.g. Sales Invoice never checks a supplier)
 * doesn't need to inject the service it will never use.
 *
 * Emits true when the party already has an account -- no dialog shown, the common case once
 * accounts are linked. When it doesn't, opens the shared warning dialog and:
 *  - 'linked' -> the user linked an account via the dialog's own "Link Account" action; emits
 *    true so the caller can proceed immediately without a second round trip.
 *  - 'change' | 'cancel' | dismissed (backdrop/Esc) -> emits false without navigating; the caller
 *    decides what "blocked" means for its own form (leave the field, refocus it, etc.) -- this
 *    helper never touches the caller's form.
 *
 * Cash documents should never call this: gate the call site on the document actually being
 * credit/term settled (the backend doesn't require a party account for cash either).
 */
export function warnIfPartyAccountMissing(
  dialog: MatDialog,
  hasAccount$: Observable<{ hasAccount: boolean }>,
  partyRole: 'customer' | 'supplier',
  partyId: number | null | undefined,
  partyName: string
): Observable<boolean> {
  if (!partyId) return of(true);

  return hasAccount$.pipe(
    switchMap(({ hasAccount }) => {
      if (hasAccount) return of(true);

      return dialog
        .open<PartyAccountRequiredDialogComponent, PartyAccountRequiredData, PartyAccountRequiredResult>(
          PartyAccountRequiredDialogComponent,
          { width: '480px', autoFocus: false, data: { partyRole, partyId, partyName } }
        )
        .afterClosed()
        .pipe(switchMap((result) => of(result === 'linked')));
    })
  );
}
