import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';
import { StoreAccountingConfigurationService } from '../../../services/store-accounting-configuration.service';
import { StoreAccountingSetupWarningDialogComponent, StoreAccountingSetupWarningResult } from './store-accounting-setup-warning-dialog.component';

/**
 * The single place every document form checks whether a selected Store has an active
 * StoreAccountingConfiguration before letting the user proceed to post against it. Mirrors
 * openCreateAccountDialog's convention (create-account-dialog.helper.ts): never duplicate this
 * dialog.open call inline in a screen, call this helper instead so every screen behaves
 * identically.
 *
 * Emits true when the store IS configured -- no dialog shown, the common case once setup is
 * complete. When it is not configured, opens the shared warning dialog and:
 *  - 'configure' -> navigates to the Store Accounting Configuration create screen (prefilled
 *    with this store via ?storeId=) and emits false, since the caller should not proceed.
 *  - 'change' | 'cancel' | dismissed (backdrop/Esc) -> emits false without navigating; the
 *    caller decides what "blocked" means for its own form (leave the field, refocus it, etc.)
 *    -- this helper never touches the caller's form.
 */
export function warnIfStoreNotConfigured(
  configService: StoreAccountingConfigurationService,
  dialog: MatDialog,
  router: Router,
  storeId: number | null | undefined,
  storeName: string
): Observable<boolean> {
  if (!storeId) return of(true);

  return configService.isConfigured(storeId).pipe(
    switchMap((configured) => {
      if (configured) return of(true);

      return dialog
        .open<StoreAccountingSetupWarningDialogComponent, { storeName: string }, StoreAccountingSetupWarningResult>(
          StoreAccountingSetupWarningDialogComponent,
          { width: '480px', autoFocus: false, data: { storeName } }
        )
        .afterClosed()
        .pipe(
          switchMap((result) => {
            if (result === 'configure') {
              router.navigate(['/setup/store-accounting-configurations/new'], { queryParams: { storeId } });
            }
            return of(false);
          })
        );
    })
  );
}
