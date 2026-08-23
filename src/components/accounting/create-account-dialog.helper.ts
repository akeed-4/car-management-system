import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AddAccountComponent, AddAccountQuickAddData } from './add-account/add-account.component';
import { Account } from './models';

/**
 * Requirement 9: the single place every "+ Create Account" affordance across the ERP opens the
 * account-creation dialog from -- reuses AddAccountComponent as-is (same business rules, same
 * numbering, same validation as the Chart of Accounts screen) via its existing
 * @Optional() MatDialogRef/MAT_DIALOG_DATA dialog-mode support. Never duplicate this dialog.open
 * call inline in a screen; call this helper instead so every screen behaves identically.
 *
 * Returns the created Account on success, or undefined if the user cancelled -- the caller
 * decides what to do with it (append to its own local account list, patch its own form/control).
 * This helper intentionally does not touch the caller's form: different screens bind their account
 * selector differently (reactive formControlName, template-driven ngModel, or a DevExtreme grid
 * cell), so patching is left to each call site.
 */
export function openCreateAccountDialog(dialog: MatDialog, data?: AddAccountQuickAddData): Observable<Account | undefined> {
  return dialog
    .open(AddAccountComponent, { width: '900px', maxWidth: '95vw', autoFocus: false, data })
    .afterClosed();
}
